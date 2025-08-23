
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getProductById } from "@/services/product-service";
import type { Product } from "@/lib/types";
import { PageHeader } from "@/components/common/page-header";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { ProductFormNew } from "@/components/products/product-form-new";
import { useTranslation } from "@/context/i18n-context";

export default function EditProductPage() {
    const params = useParams();
    const { id } = params;
    const { t } = useTranslation();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (typeof id !== 'string') return;

        const fetchProduct = async () => {
            try {
                setLoading(true);
                const fetchedProduct = await getProductById(id);
                if (fetchedProduct) {
                    setProduct(fetchedProduct);
                } else {
                    setError("Produto não encontrado.");
                }
            } catch (err) {
                setError("Falha ao carregar os dados do produto.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <div className="text-center text-red-500">{error}</div>;
    }

    return (
        <div className="space-y-4">
            <PageHeader
                title={t('productsPage.editProduct')}
                description={t('productForm.editDescription', { productName: product?.name })}
            />
            <ProductFormNew product={product} />
        </div>
    );
}
