/**
 * 企业级密码策略 + 强度校验（独立模块，前后端可共享参考）
 * 策略要求：
 *  - 长度 >= 8
 *  - 至少 1 个大写字母 A-Z
 *  - 至少 1 个小写字母 a-z
 *  - 至少 1 个数字 0-9
 *  - 至少 1 个特殊字符：!@#$%^&*()_+-=[]{}|;':",./<>?`~\
 *  - 禁止包含 3 位以上连续字符（如 "abc"/"123"/"xyz"）
 *  - 禁止包含用户名字段（大小写不敏感）
 */

export interface PasswordPolicyResult {
  ok: boolean;
  score: 0 | 1 | 2 | 3 | 4; // 0=极弱, 4=极强
  errors: string[];
  warnings: string[];
}

const SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;\':",./<>?`~\\';
const SPECIAL_REGEX = new RegExp('[' + SPECIAL_CHARS.split('').map(c => '\\' + c).join('') + ']');

function hasSequentialRun(text: string, minRun = 3): boolean {
  const t = text.toLowerCase();
  let run = 1;
  for (let i = 1; i < t.length; i++) {
    const d = t.charCodeAt(i) - t.charCodeAt(i - 1);
    if (d === 1) {
      run++;
      if (run >= minRun) return true;
    } else {
      run = 1;
    }
  }
  // 倒序递减（如 321, cba）
  run = 1;
  for (let i = 1; i < t.length; i++) {
    const d = t.charCodeAt(i) - t.charCodeAt(i - 1);
    if (d === -1) {
      run++;
      if (run >= minRun) return true;
    } else {
      run = 1;
    }
  }
  // 同字连续（如 aaa / 111）
  run = 1;
  for (let i = 1; i < t.length; i++) {
    if (t[i] === t[i - 1]) {
      run++;
      if (run >= minRun) return true;
    } else {
      run = 1;
    }
  }
  return false;
}

export function validatePasswordPolicy(password: string, username?: string): PasswordPolicyResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const p = password ?? '';
  const uname = (username ?? '').trim().toLowerCase();

  if (p.length < 8) errors.push('密码长度至少 8 位');
  if (!/[A-Z]/.test(p)) errors.push('密码必须包含至少 1 个大写字母（A-Z）');
  if (!/[a-z]/.test(p)) errors.push('密码必须包含至少 1 个小写字母（a-z）');
  if (!/\d/.test(p)) errors.push('密码必须包含至少 1 个数字（0-9）');
  if (!SPECIAL_REGEX.test(p)) errors.push('密码必须包含至少 1 个特殊字符（如 !@#$%^&* 等）');

  if (uname && uname.length >= 3 && p.toLowerCase().includes(uname)) {
    errors.push('密码不能包含您的用户名');
  }
  if (hasSequentialRun(p, 3)) {
    errors.push('密码不得包含 3 位及以上连续/重复字符（如 123 / abc / aaa）');
  }

  // 常见弱密码（企业级黑名单，初期提供常见前缀匹配）
  const weakBlacklist = ['password', '123456', 'admin', 'xinlan', 'xinlanhengcheng', 'qwerty', 'letmein'];
  for (const w of weakBlacklist) {
    if (p.toLowerCase().includes(w)) {
      warnings.push(`避免使用包含"${w}"的弱密码，容易被字典攻击`);
      break;
    }
  }
  if (p.length < 12) warnings.push('建议密码长度达到 12 位以进一步提升抗暴力破解能力');

  // 强度评分：满足一条核心策略加 1 分（满分4）
  let score: PasswordPolicyResult['score'] = 0;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score = score + 1 as PasswordPolicyResult['score'];
  if (/\d/.test(p)) score = (score + 1) as PasswordPolicyResult['score'];
  if (SPECIAL_REGEX.test(p)) score = (score + 1) as PasswordPolicyResult['score'];
  if (p.length >= 12) score = (score + 1) as PasswordPolicyResult['score'];
  // 若有错误，至少一项关键指标缺失，封顶 1
  if (errors.length > 0 && score > 1) score = 1 as PasswordPolicyResult['score'];
  if (errors.length > 0 && p.length < 8) score = 0;

  return {
    ok: errors.length === 0,
    score,
    errors,
    warnings,
  };
}

/**
 * 常用密码工具：生成 16~24 位合规随机密码
 */
export function generateStrongPassword(length = 16): string {
  const len = Math.max(12, Math.min(32, length));
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*()-_=+[]{};:,.<>?';
  const all = upper + lower + digits + special;
  const secure = typeof crypto !== 'undefined' && 'getRandomValues' in crypto;
  const pick = (src: string) => {
    if (secure) {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      return src[buf[0] % src.length];
    }
    return src[Math.floor(Math.random() * src.length)];
  };
  // 保证四类字符至少 1 个
  let pw = pick(upper) + pick(lower) + pick(digits) + pick(special);
  while (pw.length < len) pw += pick(all);
  // 简单洗牌
  return pw.split('').sort(() => (secure ? (crypto.getRandomValues(new Uint32Array(1))[0] % 2) - 0.5 : Math.random() - 0.5)).join('');
}
