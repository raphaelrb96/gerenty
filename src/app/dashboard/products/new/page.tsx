
"use client";

import { PageHeader } from "@/components/common/page-header";
import { ProductFormNew } from "@/components/products/product-form-new";
import { useTranslation } from "@/context/i18n-context";

export default function NewProductPage() {
    const { t } = useTranslation();

    return (
        <div className="space-y-4">
            <PageHeader
                title={t('productsPage.newProduct')}
                description={t('productForm.newDescription')}
            />
            <ProductFormNew />
        </div>
    );
}
