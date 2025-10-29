"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { productApi } from "@/lib/product-api";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/protected-route";
import { ArrowLeft, Sparkles, Download, Clock, Loader2 } from "lucide-react";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: string;
}

interface Variant {
  id: string;
  resultUrl: string;
  prompt: string;
  createdAt: string;
}

interface Pagination {
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
  page: number;
  total: number;
  totalPages: number;
}

interface ProductPageProps {
  id: string;
}

export default function ProductPage({ id }: ProductPageProps) {
  const [prompt, setPrompt] = useState("");
  const [page, setPage] = useState(1);
  const [allVariants, setAllVariants] = useState<Variant[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const accumulatedVariantsRef = useRef<Variant[]>([]);
  const currentPaginationRef = useRef<Pagination | null>(null);

  // Fetch Product
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await productApi.getProduct(id);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
  });

  // Fetch Variants with pagination
  const {
    data: variantResponse,
    isLoading: variantsLoading,
    isFetching: variantsFetching,
  } = useQuery({
    queryKey: ["variants", id, page],
    queryFn: async () => {
      const res = await productApi.getVariants(id, { page, limit: 5 });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
  });

  // Handle variant data accumulation
  useEffect(() => {
    if (variantResponse) {
      if (page === 1) {
        // First page - replace all data
        accumulatedVariantsRef.current = variantResponse.data;
        currentPaginationRef.current = variantResponse.pagination;
      } else {
        // Subsequent pages - append to existing data
        accumulatedVariantsRef.current = [
          ...accumulatedVariantsRef.current,
          ...variantResponse.data,
        ];
        currentPaginationRef.current = variantResponse.pagination;
      }

      // Update state with ref values
      setAllVariants([...accumulatedVariantsRef.current]);
      setPagination(currentPaginationRef.current);
    }
  }, [variantResponse, page]);

  // Generate Variant
  const generateVariantsMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await productApi.generateVariants(id, prompt);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      setPage(1);
      accumulatedVariantsRef.current = []; // Reset accumulated variants ref
      currentPaginationRef.current = null;
      setAllVariants([]); // Reset accumulated variants
      setPagination(null);
      queryClient.invalidateQueries({ queryKey: ["variants", id] });
      toast.success("Variants generated successfully!");
      setPrompt("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    generateVariantsMutation.mutate(prompt);
  };

  const handleLoadMore = () => {
    if (pagination?.hasNext) setPage((prev) => prev + 1);
  };

  if (productLoading)
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        </div>
      </ProtectedRoute>
    );

  if (!product)
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Product not found</h2>
            <Button onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen bg-gray-50">
        {/* Fullscreen Loader */}
        {generateVariantsMutation.isPending && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-2" />
            <p className="text-sm text-gray-600">Generating variants...</p>
          </div>
        )}

        {/* Header */}
        <header className="bg-white border-b shadow-sm sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">
                {product.name}
              </h1>
              <div />
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          {/* Top Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Product */}
            <Card className="overflow-hidden hover:shadow-md transition">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-blue-500" />
                  Original Product
                </CardTitle>
                <CardDescription>Base image for generation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-contain hover:scale-105 transition-transform"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  Created {new Date(product.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>

            {/* Prompt Form */}
            <div className="lg:sticky lg:top-20">
              <Card className="shadow-sm border">
                <CardHeader>
                  <CardTitle>Generate Variants</CardTitle>
                  <CardDescription>
                    Describe how you want to modify this product.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleGenerate} className="space-y-4">
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g., Make it red, add glossy finish, outdoor lighting..."
                      rows={4}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={generateVariantsMutation.isPending}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {generateVariantsMutation.isPending
                        ? "Generating..."
                        : "Generate Variants"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Variants Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Generated Variants
              </h2>
              {allVariants.length > 0 && (
                <Badge variant="secondary">
                  {allVariants.length} variant
                  {allVariants.length > 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            {variantsLoading && page === 1 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            ) : allVariants.length > 0 ? (
              <VariantGrid
                variants={allVariants}
                hasNext={pagination?.hasNext}
                onLoadMore={handleLoadMore}
                isLoading={variantsFetching}
              />
            ) : (
              <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl bg-white">
                <Sparkles className="mx-auto h-10 w-10 text-gray-400" />
                <h3 className="mt-3 text-sm font-medium text-gray-900">
                  No variants yet
                </h3>
                <p className="text-sm text-gray-500">
                  Generate your first variant using the prompt above.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
}

/* --- Variant Grid --- */
function VariantGrid({
  variants,
  hasNext,
  onLoadMore,
  isLoading,
}: {
  variants: Variant[];
  hasNext?: boolean;
  onLoadMore: () => void;
  isLoading: boolean;
}) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleDownload = async (url: string) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "variant.png";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {variants.map((v) => (
          <Card
            key={v.id}
            className="overflow-hidden hover:shadow-md transition"
          >
            <div
              className="relative h-60 bg-gray-50 cursor-pointer"
              onClick={() => setSelectedImage(v.resultUrl)}
            >
              <Image
                src={v.resultUrl}
                alt="Variant"
                fill
                className="object-contain"
              />
            </div>
            <CardContent className="p-4 flex flex-col justify-between">
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {v.prompt}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(v.createdAt).toLocaleDateString()}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(v.resultUrl)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {hasNext && (
        <div className="flex justify-center mt-8">
          <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
            {isLoading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}

      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className="max-w-4xl p-0 bg-black">
          {selectedImage && (
            <div className="relative w-full h-[80vh]">
              <Image
                src={selectedImage}
                alt="Full Variant"
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
