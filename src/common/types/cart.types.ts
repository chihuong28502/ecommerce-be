export interface ICart{
  userId: string;
  items: ICartItem[];
}
export interface ICartItem {
  productId: string; // id của sản phẩm
  variantId: string; // id của biến thể sản phẩm
  quantity: number;
}