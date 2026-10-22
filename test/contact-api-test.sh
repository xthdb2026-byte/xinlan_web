#!/bin/bash
# 联系表单 API 测试脚本 — 覆盖成功和错误流程
# 使用方法: bash test/contact-api-test.sh

API_BASE="http://localhost:3001/api"
PASS=0
FAIL=0

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

print_result() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  local status="$4"

  if [ "$status" = "pass" ]; then
    echo -e "${GREEN}  ✅ PASS${NC} | ${name}"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}  ❌ FAIL${NC} | ${name}"
    echo -e "       期望: ${expected}"
    echo -e "       实际: ${actual}"
    FAIL=$((FAIL + 1))
  fi
}

echo "=========================================="
echo "  联系表单 API 测试"
echo "  API: ${API_BASE}/contact"
echo "=========================================="
echo ""

# ==================== 成功流程 ====================
echo "--- 成功流程 ---"

# 测试 1: 完整有效数据
echo ""
echo "[测试 1] 完整有效数据提交"
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/contact" \
  -H 'Content-Type: application/json' \
  -d '{"name":"张三","phone":"13800138000","email":"zhangsan@example.com","company":"测试科技有限公司","content":"我们对智能车辆管理系统很感兴趣，希望能了解更多详情和报价。"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('code',''))" 2>/dev/null)
ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('id',''))" 2>/dev/null)
if [ "$HTTP_CODE" = "201" ] && [ "$CODE" = "OK" ] && [ -n "$ID" ]; then
  print_result "完整有效数据 → 201 + OK + id" "HTTP 201, code=OK, id存在" "HTTP ${HTTP_CODE}, code=${CODE}, id=${ID}" "pass"
else
  print_result "完整有效数据 → 201 + OK + id" "HTTP 201, code=OK, id存在" "HTTP ${HTTP_CODE}, code=${CODE}, id=${ID}" "fail"
fi

# 测试 2: 仅必填字段（无邮箱和公司）
echo ""
echo "[测试 2] 仅必填字段提交（无邮箱、无公司）"
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/contact" \
  -H 'Content-Type: application/json' \
  -d '{"name":"李四","phone":"13900139000","content":"咨询车联网安全解决方案"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('code',''))" 2>/dev/null)
if [ "$HTTP_CODE" = "201" ] && [ "$CODE" = "OK" ]; then
  print_result "仅必填字段 → 201 + OK" "HTTP 201, code=OK" "HTTP ${HTTP_CODE}, code=${CODE}" "pass"
else
  print_result "仅必填字段 → 201 + OK" "HTTP 201, code=OK" "HTTP ${HTTP_CODE}, code=${CODE}" "fail"
fi

# 测试 3: 空邮箱字符串（应成功）
echo ""
echo "[测试 3] 空邮箱字符串提交"
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/contact" \
  -H 'Content-Type: application/json' \
  -d '{"name":"王五","phone":"13700137000","email":"","content":"测试空邮箱"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('code',''))" 2>/dev/null)
if [ "$HTTP_CODE" = "201" ] && [ "$CODE" = "OK" ]; then
  print_result "空邮箱字符串 → 201 + OK" "HTTP 201, code=OK" "HTTP ${HTTP_CODE}, code=${CODE}" "pass"
else
  print_result "空邮箱字符串 → 201 + OK" "HTTP 201, code=OK" "HTTP ${HTTP_CODE}, code=${CODE}" "fail"
fi

# ==================== 错误流程 ====================
echo ""
echo "--- 错误流程 ---"

# 测试 4: 缺少姓名
echo ""
echo "[测试 4] 缺少姓名"
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/contact" \
  -H 'Content-Type: application/json' \
  -d '{"name":"","phone":"13800138000","content":"测试"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('code',''))" 2>/dev/null)
MSG=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('message',''))" 2>/dev/null)
if [ "$HTTP_CODE" = "422" ] && [ "$CODE" = "VALIDATION_ERROR" ] && [ "$MSG" = "姓名不能为空" ]; then
  print_result "缺少姓名 → 422 + VALIDATION_ERROR + 姓名不能为空" "422, VALIDATION_ERROR, 姓名不能为空" "HTTP ${HTTP_CODE}, code=${CODE}, msg=${MSG}" "pass"
else
  print_result "缺少姓名 → 422 + VALIDATION_ERROR + 姓名不能为空" "422, VALIDATION_ERROR, 姓名不能为空" "HTTP ${HTTP_CODE}, code=${CODE}, msg=${MSG}" "fail"
fi

# 测试 5: 缺少电话
echo ""
echo "[测试 5] 缺少电话"
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/contact" \
  -H 'Content-Type: application/json' \
  -d '{"name":"赵六","phone":"","content":"测试"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
MSG=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('message',''))" 2>/dev/null)
if [ "$HTTP_CODE" = "422" ] && [ "$MSG" = "电话不能为空" ]; then
  print_result "缺少电话 → 422 + 电话不能为空" "422, 电话不能为空" "HTTP ${HTTP_CODE}, msg=${MSG}" "pass"
else
  print_result "缺少电话 → 422 + 电话不能为空" "422, 电话不能为空" "HTTP ${HTTP_CODE}, msg=${MSG}" "fail"
fi

# 测试 6: 缺少留言内容
echo ""
echo "[测试 6] 缺少留言内容"
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/contact" \
  -H 'Content-Type: application/json' \
  -d '{"name":"钱七","phone":"13800138000","content":""}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
MSG=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('message',''))" 2>/dev/null)
if [ "$HTTP_CODE" = "422" ] && [ "$MSG" = "留言内容不能为空" ]; then
  print_result "缺少留言内容 → 422 + 留言内容不能为空" "422, 留言内容不能为空" "HTTP ${HTTP_CODE}, msg=${MSG}" "pass"
else
  print_result "缺少留言内容 → 422 + 留言内容不能为空" "422, 留言内容不能为空" "HTTP ${HTTP_CODE}, msg=${MSG}" "fail"
fi

# 测试 7: 邮箱格式错误
echo ""
echo "[测试 7] 邮箱格式错误"
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/contact" \
  -H 'Content-Type: application/json' \
  -d '{"name":"孙八","phone":"13800138000","email":"invalid-email","content":"测试"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
MSG=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('message',''))" 2>/dev/null)
if [ "$HTTP_CODE" = "422" ] && [ "$MSG" = "邮箱格式不正确" ]; then
  print_result "邮箱格式错误 → 422 + 邮箱格式不正确" "422, 邮箱格式不正确" "HTTP ${HTTP_CODE}, msg=${MSG}" "pass"
else
  print_result "邮箱格式错误 → 422 + 邮箱格式不正确" "422, 邮箱格式不正确" "HTTP ${HTTP_CODE}, msg=${MSG}" "fail"
fi

# 测试 8: 姓名超长（>50字符）
echo ""
echo "[测试 8] 姓名超长（>50字符）"
LONG_NAME=$(python3 -c "print('测' * 51)")
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/contact" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"${LONG_NAME}\",\"phone\":\"13800138000\",\"content\":\"测试\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('code',''))" 2>/dev/null)
if [ "$HTTP_CODE" = "422" ] && [ "$CODE" = "VALIDATION_ERROR" ]; then
  print_result "姓名超长 → 422 + VALIDATION_ERROR" "422, VALIDATION_ERROR" "HTTP ${HTTP_CODE}, code=${CODE}" "pass"
else
  print_result "姓名超长 → 422 + VALIDATION_ERROR" "422, VALIDATION_ERROR" "HTTP ${HTTP_CODE}, code=${CODE}" "fail"
fi

# 测试 9: 留言内容超长（>2000字符）
echo ""
echo "[测试 9] 留言内容超长（>2000字符）"
LONG_CONTENT=$(python3 -c "print('测' * 2001)")
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/contact" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"周九\",\"phone\":\"13800138000\",\"content\":\"${LONG_CONTENT}\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('code',''))" 2>/dev/null)
if [ "$HTTP_CODE" = "422" ] && [ "$CODE" = "VALIDATION_ERROR" ]; then
  print_result "留言超长 → 422 + VALIDATION_ERROR" "422, VALIDATION_ERROR" "HTTP ${HTTP_CODE}, code=${CODE}" "pass"
else
  print_result "留言超长 → 422 + VALIDATION_ERROR" "422, VALIDATION_ERROR" "HTTP ${HTTP_CODE}, code=${CODE}" "fail"
fi

# 测试 10: 空请求体
echo ""
echo "[测试 10] 空请求体"
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/contact" \
  -H 'Content-Type: application/json' \
  -d '{}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('code',''))" 2>/dev/null)
if [ "$HTTP_CODE" = "422" ] && [ "$CODE" = "VALIDATION_ERROR" ]; then
  print_result "空请求体 → 422 + VALIDATION_ERROR" "422, VALIDATION_ERROR" "HTTP ${HTTP_CODE}, code=${CODE}" "pass"
else
  print_result "空请求体 → 422 + VALIDATION_ERROR" "422, VALIDATION_ERROR" "HTTP ${HTTP_CODE}, code=${CODE}" "fail"
fi

# ==================== 汇总 ====================
echo ""
echo "=========================================="
echo -e "  ${GREEN}通过: ${PASS}${NC}  ${RED}失败: ${FAIL}${NC}  总计: $((PASS + FAIL))"
echo "=========================================="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
