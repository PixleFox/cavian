'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProductTable from './ProductTable';
import ProductForm from './ProductForm';

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, [router]); // Added router to the dependency array

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleDelete = async (productId: number) => {
    try {
      await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">مدیریت محصولات</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
        >
          افزودن محصول جدید
        </button>
      </div>

      {showForm && (
        <ProductForm
          onClose={() => {
            setShowForm(false);
            fetchProducts();
          }}
        />
      )}

      <ProductTable
        products={products}
        onEdit={(product) => router.push(`/admin/products/${product.id}`)}
        onDelete={handleDelete}
      />
    </div>
  );
}