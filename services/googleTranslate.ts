/**
 * Dịch miễn phí sử dụng API Google Translate (GTX)
 * API này không cần Key, không tốn Token, nhưng nên gọi chừng mực.
 */
export const translateWithGoogleFree = async (text: string, targetLang: string = 'vi'): Promise<string> => {
  if (!text || !text.trim()) return "";

  try {
    // Mapping tên ngôn ngữ sang mã ISO mà Google hiểu
    const langCode = targetLang.toLowerCase().includes("viet") ? "vi" 
                   : targetLang.toLowerCase().includes("eng") ? "en" 
                   : "vi"; // Mặc định là Việt Nam

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(url);
    const data = await response.json();

    // Google trả về dạng mảng lồng nhau, cần ghép lại
    // data[0] chứa các đoạn text đã dịch
    if (data && data[0]) {
      return data[0].map((item: any) => item[0]).join("");
    }
    return text;
  } catch (error) {
    console.error("Google Translate Free Error:", error);
    return text; // Nếu lỗi thì trả về text gốc
  }
};