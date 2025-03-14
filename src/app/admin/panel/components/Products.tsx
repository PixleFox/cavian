'use client';
import { useState, useEffect } from 'react';
import ProductTable from './ProductTable';
import ProductForm from './ProductForm';

// Define Product interface (copied from ProductTable for consistency)
interface Product {
  id: number;
  name: string;
  product_code: string;
  description: string;
  material: 'نخ پنبه' | 'اسپان' | 'ترکیبی' | 'فلامنت' | 'جودون' | 'ویسکوز' | 'ملانژ';
  gender: 'MALE' | 'FEMALE' | 'UNISEX';
  type: 'T_SHIRT' | 'ACCESSORIES';
  sleeve_type: 'SHORT' | 'LONG' | 'SLEEVELESS';
  collar_type: 'CIRCLE' | 'SEVEN' | 'COLLARED';
  discount_percent: number | null;
  category_ids: string[];
  variants: {
    id: number;
    size: 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL' | '4XL';
    color: string;
    stock: number;
    price: number;
    sku: string;
  }[];
  images: {
    id: number;
    image_url: string;
    is_main_image: boolean;
  }[];
}

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]); // Type products as Product[]
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null); // Type as Product or null

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data); // TypeScript now expects data to match Product[]
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleDelete = async (productId: number) => {
    try {
      await fetch(`/api/products?id=${productId}`, {
        method: 'DELETE',
      });
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleEdit = (product: Product) => { // Explicitly type product
    setSelectedProduct(product);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setSelectedProduct(null);
    fetchProducts();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">مدیریت محصولات</h2>
        <button
          onClick={() => {
            setSelectedProduct(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-red-400 transition"
        >
          افزودن محصول جدید
        </button>
      </div>

      {showForm && (
        <ProductForm
          onClose={closeForm}
          refreshProducts={fetchProducts}
          product={selectedProduct}
        />
      )}

      <ProductTable
        products={products}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}