import { Shield, TrendingUp, Heart } from 'lucide-react';

const cultureItems = [
  {
    icon: Shield,
    title: '价值观',
    description: '外稳内动，恒久达成。以技术创新驱动行业发展，为客户创造持久价值。',
  },
  {
    icon: TrendingUp,
    title: '成长',
    description: '提供完善的培训体系与晋升通道，鼓励持续学习，与公司共同成长。',
  },
  {
    icon: Heart,
    title: '福利',
    description: '五险一金、弹性工作、年度体检、节日福利，关注每位员工的身心健康。',
  },
];

export default function CultureSection() {
  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="container-page">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-ink lg:text-4xl">为什么选择新蓝恒成</h2>
          <p className="mt-4 text-base text-ink-500">
            我们致力于为员工提供优秀的工作环境与发展平台
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {cultureItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex flex-col items-center rounded-2xl bg-ink-50 p-8 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-ink">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-500">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
