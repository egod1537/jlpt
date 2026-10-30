#!/bin/sh
set -eu

if [ "$(uname -s)" != "Darwin" ]; then
  echo "설치 중단: 이 설치 스크립트는 macOS launchd 전용입니다." >&2
  exit 1
fi

deployment_root=$(git rev-parse --show-toplevel)
deployment_poll_script="$deployment_root/src/front/scripts/poll-and-deploy-main.sh"
deployment_label="net.mangagaki.jlpt.deploy-main"
deployment_user_id=$(id -u)
deployment_agent_dir="$HOME/Library/LaunchAgents"
deployment_log_dir="$HOME/Library/Logs"
deployment_plist="$deployment_agent_dir/$deployment_label.plist"
deployment_log="$deployment_log_dir/jlpt-deploy-main.log"

xml_escape() {
  sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g' -e 's/"/\&quot;/g'
}

deployment_root_xml=$(printf '%s' "$deployment_root" | xml_escape)
deployment_poll_script_xml=$(printf '%s' "$deployment_poll_script" | xml_escape)
deployment_log_xml=$(printf '%s' "$deployment_log" | xml_escape)

mkdir -p "$deployment_agent_dir" "$deployment_log_dir"
deployment_temp_plist=$(mktemp "$deployment_agent_dir/$deployment_label.XXXXXX")
trap 'rm -f "$deployment_temp_plist"' EXIT HUP INT TERM

cat > "$deployment_temp_plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$deployment_label</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/sh</string>
    <string>$deployment_poll_script_xml</string>
  </array>
  <key>WorkingDirectory</key>
  <string>$deployment_root_xml</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/opt/homebrew/bin:/usr/local/bin:/Applications/Docker.app/Contents/Resources/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>StartInterval</key>
  <integer>300</integer>
  <key>ProcessType</key>
  <string>Background</string>
  <key>StandardOutPath</key>
  <string>$deployment_log_xml</string>
  <key>StandardErrorPath</key>
  <string>$deployment_log_xml</string>
</dict>
</plist>
EOF

plutil -lint "$deployment_temp_plist" >/dev/null
chmod 600 "$deployment_temp_plist"
mv "$deployment_temp_plist" "$deployment_plist"
trap - EXIT HUP INT TERM

launchctl bootout "gui/$deployment_user_id/$deployment_label" >/dev/null 2>&1 || true
launchctl bootstrap "gui/$deployment_user_id" "$deployment_plist"
launchctl enable "gui/$deployment_user_id/$deployment_label"
launchctl kickstart "gui/$deployment_user_id/$deployment_label"

echo "main 자동 배포 LaunchAgent 설치 완료 (5분 간격)"
echo "상태: launchctl print gui/$deployment_user_id/$deployment_label"
echo "로그: $deployment_log"
