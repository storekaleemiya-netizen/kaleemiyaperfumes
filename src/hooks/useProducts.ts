import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
    collection, 
    onSnapshot, 
    query, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    Timestamp, 
    orderBy, 
    limit, 
    startAfter, 
    getDocs 
} from "firebase/firestore";

export interface Product {
    id: string;
    name: string;
    price: string;
    discountPrice?: string;
    numericPrice: number;
    category: string;
    subCategory?: string;
    gender: string;
    image: string;
    section?: string;
    stock?: number;
    status?: string;
    isLive?: boolean;
    isNew?: boolean;
    isBestseller?: boolean;
    description?: string;
    highlights?: string[];
    specs?: Record<string, string>;
    createdAt?: any;
    isFallback?: boolean;
    extraImages?: string[];
    video?: string;
}

export const Signature_FALLBACKS: Product[] = [];

export const useProducts = (pageSize = 20) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState<any>(null);

    useEffect(() => {
        // High-Traffic Optimization: Real-time listener limited to the first batch
        const q = query(
            collection(db, "products"), 
            orderBy("createdAt", "desc"),
            limit(pageSize)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const productList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Product));
            
            setProducts(productList);
            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            setHasMore(snapshot.docs.length === pageSize);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching products:", error);
            setProducts(Signature_FALLBACKS);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [pageSize]);

    const loadMore = async () => {
        if (!lastDoc || !hasMore) return;
        
        const q = query(
            collection(db, "products"),
            orderBy("createdAt", "desc"),
            startAfter(lastDoc),
            limit(pageSize)
        );

        const snapshot = await getDocs(q);
        const newProducts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Product));

        setProducts(prev => [...prev, ...newProducts]);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === pageSize);
    };

    const addProduct = async (product: Omit<Product, "id">) => {
        try {
            await addDoc(collection(db, "products"), {
                ...product,
                createdAt: Timestamp.now()
            });
        } catch (error) {
            console.error("Error adding product:", error);
            throw error;
        }
    };

    const updateProduct = async (updatedProduct: Product) => {
        try {
            const productRef = doc(db, "products", updatedProduct.id);
            const { id, isFallback, ...data } = updatedProduct;
            await updateDoc(productRef, data);
        } catch (error) {
            console.error("Error updating product:", error);
            throw error;
        }
    };

    const deleteProduct = async (id: string) => {
        try {
            await deleteDoc(doc(db, "products", id));
        } catch (error) {
            console.error("Error deleting product:", error);
            throw error;
        }
    };

    return { products, loading, hasMore, loadMore, addProduct, updateProduct, deleteProduct };
};
