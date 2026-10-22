import Hero from '@/components/home/Hero';
import ProductPreview from '@/components/home/ProductPreview';
import NewsPreview from '@/components/home/NewsPreview';
import { getFooterData } from '@/lib/api';
import { DEFAULT_FOOTER_CONTACT } from '@/lib/footerDefaults';
import type { FooterContactData } from '@/lib/types';

/**
 * SSR 安全获取 FooterContact：与 contact/page.tsx 共用兜底。
 * — 首页流量最大，默认 revalidate 1h，SEO 友好且减少后端压力。
 */
async function getContactDataForHome(): Promise<FooterContactData> {
  try {
    const data = await getFooterData();
    if (data?.contact) return data.contact;
  } catch {
    /* 静默回落 */
  }
  return DEFAULT_FOOTER_CONTACT;
}

/**
 * 从完整地址字符串中启发式拆分 JSON-LD 需要的「省 / 市 / 街道」。
 * — 当地址不以明确的「省 / 自治区 / 直辖市」开头（例如：省略省名直接写"湘潭雨湖区..."），
 *   为了避免启发式解析得到误导结果（把"湘潭雨湖"拆错，把"雨湖区"识别成"湖区"等），
 *   回退策略为：把整条地址都作为 streetAddress 返回，addressRegion/addressLocality
 *   仅保留 companyName 中能推断出的保守值（湖南，不写具体市），
 *   让搜索引擎爬虫在明确的 streetAddress 基础上自行定位，比乱写更安全。
 */
function splitAddress(
  contact: FooterContactData,
): { streetAddress: string; addressLocality: string; addressRegion: string } {
  const raw = (contact.address || '').trim();
  if (!raw) {
    return {
      streetAddress: '湖南省长沙市岳麓区麓谷街道',
      addressLocality: '长沙市岳麓区',
      addressRegion: '湖南省',
    };
  }

  // (1) 必须有明确的省级后缀才能进入拆分逻辑（省/自治区/直辖市）
  const regionM = raw.match(/^(.{2,10}?(?:省|自治区))/);
  const directCityM = !regionM
    ? raw.match(/^(北京|上海|天津|重庆)市?/)
    : null;

  let region: string | null = null;
  if (regionM) region = regionM[1];
  else if (directCityM) region = `${directCityM[1]}市`;

  if (!region) {
    // 无法可靠识别省级 — 整条地址 streetAddress 兜底
    // 从公司名推断省（湖南新蓝恒成 → 湖南省），不填具体市，避免误导
    const inferredFromCompany = contact.companyName.includes('湖南')
      ? '湖南省'
      : contact.companyName.includes('湖北')
        ? '湖北省'
        : contact.companyName.includes('广东')
          ? '广东省'
          : contact.companyName.includes('北京')
            ? '北京市'
            : contact.companyName.includes('上海')
              ? '上海市'
              : null;
    return {
      streetAddress: raw,
      addressLocality: inferredFromCompany ? '' : '', // 留空比瞎编安全（schema 可接受）
      addressRegion: inferredFromCompany ?? '中国',
    };
  }

  // (2) 去省后：识别市/州/盟 + 区/县
  // 规范模式：湖南省长沙市岳麓区麓谷街道  → region=湖南省 rest1=长沙市岳麓区麓谷街道
  // 湘潭特例：湖南省湘潭市雨湖区旺城天誉...
  const rest1 = raw.slice(region.length);
  let city: string | null = null;
  let district: string | null = null;

  // 2.1 先试 "长沙市(岳麓区)" / "湘潭市(雨湖区)" 这种 市+区 紧连
  const cityWithDistrict = rest1.match(/^(.{2,10}市)(.{2,10}?(?:区|县|旗))/);
  if (cityWithDistrict) {
    city = cityWithDistrict[1];
    district = cityWithDistrict[2];
  } else {
    const cityOnly = rest1.match(/^(.{2,10}市)/);
    if (cityOnly) city = cityOnly[1];
  }

  const locality = (city && district) ? `${city}${district}` : city ?? '';
  const consumed = region.length + locality.length;
  const street = raw.slice(consumed).trim() || raw;

  return {
    streetAddress: street,
    addressLocality: locality || region,   // 无市时退而求其次填 region，schema 不会报错
    addressRegion: region,
  };
}

function telephoneSchema(phone: string): string {
  const digits = phone.replace(/[^\d+\-]/g, '');
  if (!digits) return '+86';
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('86')) return `+${digits}`;
  return `+86-${digits}`;
}

export default async function HomePage() {
  const contact = await getContactDataForHome();
  const addr = splitAddress(contact);

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: contact.companyName,
    alternateName: '新蓝恒成',
    url: 'https://xinlanhengcheng.com',
    logo: 'https://xinlanhengcheng.com/logo.svg',
    description:
      `${contact.companyName} — 致力于提供安全可靠、技术创新的信息技术服务与解决方案。`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: telephoneSchema(contact.phone),
      contactType: 'customer service',
      email: contact.email,
      areaServed: 'CN',
      availableLanguage: ['Chinese', 'zh-CN'],
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: addr.streetAddress,
      addressLocality: addr.addressLocality,
      addressRegion: addr.addressRegion,
      addressCountry: 'CN',
    },
    sameAs: [],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <Hero />
      <ProductPreview />
      <NewsPreview />
    </>
  );
}
