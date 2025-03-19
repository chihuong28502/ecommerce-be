import { Injectable } from '@nestjs/common';

@Injectable()
export class PromptService {
  getPromptInput(content: string) {
    return `
      Hãy kiểm tra xem mô tả  ý tưởng kinh doanh và các dữ liệu sau có vi phạm pháp luật không. Chỉ trả về một trong hai giá trị là "True" hoặc "False":
       - "False": nếu ý tưởng kinh doanh liên quan đến các hoạt động bất hợp pháp như ma túy, vũ khí, lừa đảo, buôn lậu, gian lận, hoặc các hoạt động phạm pháp khác
       - "True": nếu là ý tưởng kinh doanh hợp pháp

       Mô tả dữ liệu : 
       ${content}
       - Một số danh mục kinh doanh bị cấm : thuốc lá điện tử (pod) , khí cười(N2O) , tất cả những thứ liên quan đến hoa anh túc
       Các mảng kinh doanh dưới đây bị cấm:
       -Kinh doanh mại dâm
       -Kinh doanh các loại vũ khí, chất nổ
       -Kinh doanh các sản phẩm vi phạm đạo đức xã hội
       -Kinh doanh các sản phẩm độc hại, gây ô nhiễm môi trường
       -Kinh doanh các sản phẩm giả mạo hoặc xâm phạm quyền sở hữu trí tuệ
       -Kinh doanh động vật hoang dã, các sản phẩm từ động vật quý hiếm
       -Kinh doanh các hoạt động tài chính không hợp pháp
       -cấm các thông tin liên quan đến đòi nợ thuê nhé 
       Chú ý: chỉ trả về "False" hoặc "True" trong json. Còn lại không trả về thêm bất kì một thông báo hoặc commetn hoặc bất cứ text hay số nào khác.
       Format json trả lời:
       {
           "Bool":"giá trị True hoặc False"
       }
       Nhớ luôn trả lời theo format json,  Nhớ luôn trả lời theo format json, Nhớ luôn trả lời theo format json.

   `;
  };
}
