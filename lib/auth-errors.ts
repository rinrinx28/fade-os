/** Dịch lỗi auth của Supabase sang tiếng Việt rõ nghĩa. */
export function viAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("different from the old"))
    return "Mật khẩu mới phải KHÁC mật khẩu cũ. Hãy chọn một mật khẩu khác.";
  if (m.includes("at least") || m.includes("too short"))
    return "Mật khẩu quá ngắn (tối thiểu 6 ký tự).";
  if (m.includes("weak") || m.includes("pwned"))
    return "Mật khẩu quá yếu/dễ đoán, hãy chọn mật khẩu mạnh hơn.";
  if (m.includes("invalid login") || m.includes("invalid credentials"))
    return "Email hoặc mật khẩu không đúng.";
  if (m.includes("email") && (m.includes("invalid") || m.includes("not valid")))
    return "Email không hợp lệ (hãy dùng email thật để nhận mã).";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.";
  if (m.includes("for security purposes"))
    return "Vui lòng đợi một chút rồi thử lại.";
  if (m.includes("expired"))
    return "Mã đã hết hạn. Hãy bấm gửi lại mã.";
  if (m.includes("invalid") && (m.includes("otp") || m.includes("token")))
    return "Mã không đúng. Kiểm tra lại 6 số trong email.";
  return msg;
}
