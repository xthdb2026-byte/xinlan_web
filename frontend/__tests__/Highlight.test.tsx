import React from 'react';
import { render, screen } from '@testing-library/react';
import Highlight from '@/components/common/Highlight';

/**
 * Highlight 组件测试
 *
 * 覆盖要点：
 * 1. 正确高亮匹配的关键词
 * 2. 支持多个匹配项
 * 3. 关键词为空时原样渲染文本
 * 4. 正确处理特殊字符（正则转义）
 * 5. 不区分大小写
 */
describe('Highlight 组件', () => {
  it('应正确高亮匹配的关键词', () => {
    render(<Highlight text="新蓝恒成信息安全" keyword="信息安全" />);
    const mark = screen.getByText('信息安全');
    expect(mark.tagName).toBe('MARK');
    expect(mark).toHaveClass('bg-brand-100', 'text-brand-700');
  });

  it('应支持多个匹配项', () => {
    render(<Highlight text="安全产品安全服务安全" keyword="安全" />);
    const marks = screen.getAllByText('安全');
    expect(marks.length).toBe(3);
    marks.forEach((m) => {
      expect(m.tagName).toBe('MARK');
    });
  });

  it('关键词为空时应原样渲染文本', () => {
    render(<Highlight text="新蓝恒成信息安全" keyword="" />);
    const span = screen.getByText('新蓝恒成信息安全');
    expect(span.tagName).toBe('SPAN');
    expect(screen.queryByRole('mark')).not.toBeInTheDocument();
  });

  it('关键词仅为空白时应原样渲染文本', () => {
    render(<Highlight text="新蓝恒成信息安全" keyword="   " />);
    const span = screen.getByText('新蓝恒成信息安全');
    expect(span.tagName).toBe('SPAN');
  });

  it('应正确处理特殊字符（正则转义）', () => {
    render(<Highlight text="价格 $100.00 (优惠)" keyword="$100.00" />);
    const mark = screen.getByText('$100.00');
    expect(mark.tagName).toBe('MARK');
  });

  it('应不区分大小写', () => {
    render(<Highlight text="XINLAN HENGCHENG" keyword="xinlan" />);
    const mark = screen.getByText('XINLAN');
    expect(mark.tagName).toBe('MARK');
  });

  it('无匹配时应原样渲染文本', () => {
    render(<Highlight text="新蓝恒成信息安全" keyword="不存在" />);
    const span = screen.getByText('新蓝恒成信息安全');
    expect(span.tagName).toBe('SPAN');
  });

  it('应支持自定义 className', () => {
    render(<Highlight text="测试文本" keyword="测试" className="custom-class" />);
    const mark = screen.getByText('测试');
    expect(mark).toHaveClass('custom-class');
  });
});
