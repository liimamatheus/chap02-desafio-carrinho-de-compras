import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const provCartRef = useRef<Product[]>();

  useEffect(() => {
    provCartRef.current = cart;
  })

  const cartPreviousValue = provCartRef.current ?? cart;

  useEffect (() => {
    if (cartPreviousValue !== cart) {
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
    }
  }, [cart, cartPreviousValue])

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart]; // select array and increment
      const productExists = updatedCart.find(product => product.id === productId); //search exist products by id

      const stock = await api.get(`/stock/${productId}`); // select quantity in stock api

      const stockAmount = stock.data.amount; // identify quantity in stock
      const currentAmount = productExists ? productExists.amount : 0; // verify if product exists and get your amount
      const amount = currentAmount + 1; // Add one more item to cart 

      if (amount > stockAmount) { // if quantity amount more than stock amount
        toast.error('Quantidade solicitada fora de estoque'); // error message
        return; // return if
      }

      if (productExists) {
        productExists.amount = amount; // if product exist, add quantity to cart (refresh)
      } else {
        const product = await api.get(`/products/${productId}`) //verify ID in API for put in the cart a new product

        const newProduct = {
          ...product.data,
          amount: 1
        } // this const set amount +1 and get your products data (view in types.ts)
        updatedCart.push(newProduct); //push method add value in array and show new array with values refresh
      }

      setCart(updatedCart); // refresh cart to increment a new itens
    } catch {
      toast.error('Erro na adição do produto'); //show error message at index with toast
    }
  };

  const removeProduct = (productId: number) => { //const to remove product at cart
    try {
      const updatedCart = [...cart]; //verify if product exists in the cart, if yes, just amount +1
      const productIndex = updatedCart.findIndex(product => product.id === productId); //use findIndex because in the future is necessary to remove in array

      if (productIndex >= 0) { //if find product in the cart
        updatedCart.splice(productIndex, 1); //remove product once a time
        setCart(updatedCart); //send changes to variables in array
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na remoção do produto'); //show error message at index with toast
    }
  };

  const updateProductAmount = async ({ //async function
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) { // if the quantity is lower than zero
        return; //get out the function
      }

      const stock = await api.get(`/stock/${productId}`); //verify in api quantity stock

      const stockAmount = stock.data.amount; //compare quantity to stock amount 

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId)

      if (productExists) {
        productExists.amount = amount;
        setCart(updatedCart);
        } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto'); //error message with toast
      return;
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
