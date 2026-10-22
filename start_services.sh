#!/bin/bash
# =============================================================
# 新蓝恒成网站 — 一键启动脚本（守护模式，不受shell关闭影响）
#
# 用法: ./start_services.sh start | stop | status
# =============================================================

set -u

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

PID_DIR="$PROJECT_DIR/.runtime"
mkdir -p "$PID_DIR"
BACK_PIDFILE="$PID_DIR/backend.pid"
FRONT_PIDFILE="$PID_DIR/frontend.pid"
LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"

NODE_BIN="$(command -v node)"
NPM_BIN="$(command -v npm)"
export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$HOME/.nvm/versions/node/current/bin:$PATH"

# --- 读端口 ---
BACKEND_PORT=3001
FRONTEND_PORT=3000

# ==========================================================
log() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"; }

is_port_open() {
  local port=$1
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"${port}" -sTCP:LISTEN -nP >/dev/null 2>&1
  else
    nc -z 127.0.0.1 "${port}" >/dev/null 2>&1
  fi
  return $?
}

safe_kill() {
  local pidfile=$1 name=$2
  if [ -f "$pidfile" ]; then
    local pid
    pid=$(cat "$pidfile" 2>/dev/null || true)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      log "停止 $name (PID=$pid) ..."
      kill "$pid" 2>/dev/null || true
      sleep 1
      kill -9 "$pid" 2>/dev/null || true
      rm -f "$pidfile"
    else
      rm -f "$pidfile"
    fi
  fi
}

# ==========================================================
do_start_backend() {
  if is_port_open "$BACKEND_PORT"; then
    log "后端端口 $BACKEND_PORT 已被占用，跳过启动"
    return 0
  fi
  log "启动后端 (port $BACKEND_PORT) ..."
  cd "$BACKEND_DIR"

  # 如果没编译，先编译
  if [ ! -f "$BACKEND_DIR/dist/app.js" ]; then
    log "首次编译后端 dist ..."
    npx tsc --build > "$LOG_DIR/backend-build.log" 2>&1 || { log "❌ 后端编译失败"; return 1; }
  fi

  nohup node dist/app.js > "$LOG_DIR/backend.log" 2>&1 </dev/null &
  local pid=$!
  echo $pid > "$BACK_PIDFILE"
  sleep 3
  for i in 1 2 3 4 5 6 7 8; do
    sleep 1
    if is_port_open "$BACKEND_PORT"; then
      log "✅ 后端已就绪 PID=$pid"
      return 0
    fi
  done
  log "⚠️ 后端启动超时，查看日志 $LOG_DIR/backend.log"
  return 0
}

do_start_frontend() {
  if is_port_open "$FRONTEND_PORT"; then
    log "前端端口 $FRONTEND_PORT 已被占用，跳过启动"
    return 0
  fi
  log "启动前端 (port $FRONTEND_PORT) ..."
  cd "$FRONTEND_DIR"

  nohup npm run dev -- --hostname 0.0.0.0 --port "$FRONTEND_PORT" > "$LOG_DIR/frontend.log" 2>&1 </dev/null &
  local pid=$!
  echo $pid > "$FRONT_PIDFILE"
  for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
    sleep 2
    if is_port_open "$FRONTEND_PORT"; then
      log "✅ 前端已就绪 PID=$pid"
      return 0
    fi
  done
  log "⚠️ 前端启动超时，查看日志 $LOG_DIR/frontend.log"
  return 0
}

# ==========================================================
case "${1:-start}" in
  start)
    log "============================="
    log "🚀 启动新蓝恒成前后端服务"
    log "项目目录: $PROJECT_DIR"
    log "日志目录: $LOG_DIR"
    log "============================="
    do_start_backend
    do_start_frontend
    sleep 1
    # 最终验证
    BACK_OK=$(curl -s --max-time 3 "http://127.0.0.1:${BACKEND_PORT}/api/logo/current" 2>&1 | grep -c "OK" || true)
    FRONT_OK=$({ curl -sI --max-time 3 "http://127.0.0.1:${FRONTEND_PORT}/" 2>&1 | grep -q "HTTP"; } && echo 1 || echo 0)
    log "============================================"
    log "后端 : $([ "$BACK_OK" -ge 1 ] && echo '✅ 正常' || echo '⚠️ 异常') http://127.0.0.1:${BACKEND_PORT}"
    log "前端 : $([ "$FRONT_OK" = "1" ] && echo '✅ 正常' || echo '⚠️ 异常') http://127.0.0.1:${FRONTEND_PORT}"
    log "日志 : tail -f $LOG_DIR/backend.log / frontend.log"
    log "============================================"
    ;;
  stop)
    log "停止服务..."
    safe_kill "$BACK_PIDFILE" "后端"
    safe_kill "$FRONT_PIDFILE" "前端"
    sleep 1
    log "✅ 所有服务已停止"
    ;;
  status)
    if is_port_open "$BACKEND_PORT"; then echo "✅ 后端端口 $BACKEND_PORT 开放"; else echo "❌ 后端端口 $BACKEND_PORT 关闭"; fi
    if is_port_open "$FRONTEND_PORT"; then echo "✅ 前端端口 $FRONTEND_PORT 开放"; else echo "❌ 前端端口 $FRONTEND_PORT 关闭"; fi
    [ -f "$BACK_PIDFILE" ] && echo "后端 PID: $(cat $BACK_PIDFILE) (文件)" || echo "后端 PID 记录不存在"
    [ -f "$FRONT_PIDFILE" ] && echo "前端 PID: $(cat $FRONT_PIDFILE) (文件)" || echo "前端 PID 记录不存在"
    ;;
  *)
    echo "用法: $0 start | stop | status" >&2
    exit 1
    ;;
esac
