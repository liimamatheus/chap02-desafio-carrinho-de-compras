import React, { useState, useEffect } from 'react';
import { MdAddShoppingCart } from 'react-icons/md';

import { ProductList } from './styles';
import { api } from '../../services/api';
import { formatPrice } from '../../util/format';
import { useCart } from '../../hooks/useCart';

interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
}

interface ProductFormatted extends Product {
  priceFormatted: string;
}

interface CartItemsAmount {
  [key: number]: number;
}

const Home = (): JSX.Element => {
  const [products, setProducts] = useState<ProductFormatted[]>([]);
  const { addProduct, cart } = useCart();

  const cartItemsAmount = cart.reduce((sumAmount, product) => {
    const newSumAmount = { ...sumAmount };
    newSumAmount[product.id] = product.amount;

    return newSumAmount;
  }, {} as CartItemsAmount)

  useEffect(() => {
    async function loadProducts() { //async function to load products
      const response = await api.get<Product[]>('products'); //get products by api, needed to put Product type and array with anyone value 

      const data = response.data.map(product => ({ 
        ...product,
        priceFormatted: formatPrice(product.price)
      })) //const to format the price and apply your conditions

      setProducts(data); // set data to products
    }

    loadProducts();
  }, []);

  function handleAddProduct(id: number) {
    addProduct(id); // function to add product at cart
  }

  return (
    <ProductList>
      {products.map(product => ( //pass the product characteristics in the cart, with variables data
        <li key={product.id}> 
          <img src={product.image} alt={product.title} /> 
          <strong>{product.title}</strong>
          <span>{product.priceFormatted}</span>
          <button
            type="button"
            data-testid="add-product-button"
            onClick={() => handleAddProduct(product.id)}
          >
            <div data-testid="cart-product-quantity">
              <MdAddShoppingCart size={16} color="#FFF" />
              {cartItemsAmount[product.id] || 0} 
          </div>

            <span>ADICIONAR AO CARRINHO</span>
          </button>
        </li>
      ))} 
    </ProductList> //first element needed a key and another data depends kind of itens your add on the cart
  );
};

export default Home;
