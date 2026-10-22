import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminListPage from '@/components/admin/AdminListPage';
import { getAdminList, deleteAdminItem } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  getAdminList: jest.fn(),
  deleteAdminItem: jest.fn(),
}));

const mockedGetList = getAdminList as jest.MockedFunction<typeof getAdminList>;

interface Row {
  id: number;
  name: string;
}

const rows: Row[] = [
  { id: 1, name: '产品一' },
  { id: 2, name: '产品二' },
  { id: 3, name: '产品三' },
];

function mockList(items: Row[] = rows) {
  mockedGetList.mockResolvedValue({
    items,
    total: items.length,
    page: 1,
    pageSize: 10,
  } as never);
}

const columns = [{ key: 'name', label: '名称' }];

const batchActions = [
  { action: 'publish', label: '批量上架' },
  { action: 'archive', label: '批量下架' },
  { action: 'delete', label: '批量删除', danger: true },
];

/**
 * AdminListPage 批量操作能力（自动化流程入口）
 */
describe('AdminListPage 批量操作', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockList();
  });

  it('未配置 batchActions 时不渲染复选框列', async () => {
    render(<AdminListPage<Row> module="products" title="产品管理" columns={columns} />);

    await screen.findByText('产品一');
    expect(screen.queryByLabelText('全选')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('选择第 1 条')).not.toBeInTheDocument();
  });

  it('配置 batchActions 后渲染复选框，勾选后出现批量工具栏', async () => {
    const user = userEvent.setup();
    render(
      <AdminListPage<Row>
        module="products"
        title="产品管理"
        columns={columns}
        batchActions={batchActions}
        onBatchAction={jest.fn()}
      />,
    );

    await screen.findByText('产品一');
    // 未选中时工具栏不可见
    expect(screen.queryByText(/已选/)).not.toBeInTheDocument();

    await user.click(screen.getByLabelText('选择第 1 条'));

    expect(screen.getByText('已选 1 条')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '批量上架' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '批量下架' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '批量删除' })).toBeInTheDocument();
  });

  it('全选/取消全选本页记录', async () => {
    const user = userEvent.setup();
    render(
      <AdminListPage<Row>
        module="products"
        title="产品管理"
        columns={columns}
        batchActions={batchActions}
        onBatchAction={jest.fn()}
      />,
    );

    await screen.findByText('产品一');

    await user.click(screen.getByLabelText('全选'));
    expect(screen.getByText('已选 3 条')).toBeInTheDocument();
    expect(screen.getByLabelText('选择第 2 条')).toBeChecked();

    await user.click(screen.getByLabelText('全选'));
    expect(screen.queryByText(/已选/)).not.toBeInTheDocument();
  });

  it('取消选择清空已选并隐藏工具栏', async () => {
    const user = userEvent.setup();
    render(
      <AdminListPage<Row>
        module="products"
        title="产品管理"
        columns={columns}
        batchActions={batchActions}
        onBatchAction={jest.fn()}
      />,
    );

    await screen.findByText('产品一');
    await user.click(screen.getByLabelText('选择第 1 条'));
    await user.click(screen.getByLabelText('选择第 3 条'));
    expect(screen.getByText('已选 2 条')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '取消选择' }));
    expect(screen.queryByText(/已选/)).not.toBeInTheDocument();
  });

  it('确认执行：以动作与选中 id 调用 onBatchAction，成功后清空选择并刷新列表', async () => {
    const user = userEvent.setup();
    const onBatchAction = jest.fn().mockResolvedValue(undefined);
    render(
      <AdminListPage<Row>
        module="products"
        title="产品管理"
        columns={columns}
        batchActions={batchActions}
        onBatchAction={onBatchAction}
      />,
    );

    await screen.findByText('产品一');
    await user.click(screen.getByLabelText('选择第 1 条'));
    await user.click(screen.getByLabelText('选择第 2 条'));

    // 打开确认弹窗
    await user.click(screen.getByRole('button', { name: '批量上架' }));
    expect(screen.getByText(/将对已选的/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '确认执行' }));

    await waitFor(() => {
      expect(onBatchAction).toHaveBeenCalledWith('publish', [1, 2]);
    });
    // 成功后清空选择 + 重新拉取列表
    await waitFor(() => {
      expect(screen.queryByText(/已选/)).not.toBeInTheDocument();
    });
    expect(mockedGetList).toHaveBeenCalledTimes(2); // 初次加载 + 批量后刷新
  });

  it('危险操作（删除）在确认弹窗中给出警示文案', async () => {
    const user = userEvent.setup();
    render(
      <AdminListPage<Row>
        module="products"
        title="产品管理"
        columns={columns}
        batchActions={batchActions}
        onBatchAction={jest.fn()}
      />,
    );

    await screen.findByText('产品一');
    await user.click(screen.getByLabelText('选择第 1 条'));
    await user.click(screen.getByRole('button', { name: '批量删除' }));

    expect(screen.getByText('删除后无法恢复，请谨慎操作。')).toBeInTheDocument();

    // 取消后弹窗关闭且不调用接口
    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(screen.queryByText('删除后无法恢复，请谨慎操作。')).not.toBeInTheDocument();
  });

  it('批量操作失败时展示错误信息且保留选中状态', async () => {
    const user = userEvent.setup();
    const onBatchAction = jest.fn().mockRejectedValue(new Error('单次批量操作不超过200条'));
    render(
      <AdminListPage<Row>
        module="products"
        title="产品管理"
        columns={columns}
        batchActions={batchActions}
        onBatchAction={onBatchAction}
      />,
    );

    await screen.findByText('产品一');
    await user.click(screen.getByLabelText('选择第 1 条'));
    await user.click(screen.getByRole('button', { name: '批量上架' }));
    await user.click(screen.getByRole('button', { name: '确认执行' }));

    expect(await screen.findByText('单次批量操作不超过200条')).toBeInTheDocument();
    expect(screen.getByText('已选 1 条')).toBeInTheDocument();
  });
});
