import { BaseApiClient, ApiResponse } from './api-client';

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  generations: Variant[]
}


interface Variant {
  id: string;
  resultUrl: string;
  prompt: string;
  createdAt: string;
}

class ProductApi extends BaseApiClient {
  async getProducts(): Promise<ApiResponse<Product[]>> {
    return this.get('/products');
  }

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    return this.get(`/products/${id}`);
  }

  async createProduct(name: string, image: File): Promise<ApiResponse<Product>> {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('image', image);

    try {
      const response = await this.client.post('/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return { data: response.data };
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'error' in error 
        ? (error as { error: string }).error 
        : 'An error occurred';
      return { error: errorMessage };
    }
  }

  async generateVariants(productId: string, prompt: string): Promise<ApiResponse<Product[]>> {
    return this.post(`/products/${productId}/generate`, { prompt });
  }

  async getVariants(
    productId: string,
    options?: { page?: number; limit?: number }
  ): Promise<ApiResponse<{ data: Variant[]; pagination: any }>> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
  
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  
    return this.get(`/products/${productId}/variants?${query.toString()}`);
  }
}

export const productApi = new ProductApi();
