import React, { createContext, useContext, useState, useEffect } from "react";

interface UsdtPriceContextType {
  getPrice: (tokenName: string) => number | undefined;
  addToken: (tokenName: string) => void;
}

const UsdtPriceContext = createContext<UsdtPriceContextType | undefined>(
  undefined,
);

export const UsdtPriceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [prices, setPrices] = useState<{ [token: string]: number }>({});
  const [tokens, setTokens] = useState<string[]>([]);

  const fetchPrice = async (tokenName: string) => {
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=${tokenName.toUpperCase()}USDT`,
      );
      const data = await response.json();
      setPrices((prevPrices) => ({
        ...prevPrices,
        [tokenName.toUpperCase()]: parseFloat(data.price),
      }));
    } catch (error) {
      console.error(`Error fetching price for ${tokenName}:`, error);
    }
  };

  const addToken = (tokenName: string) => {
    if (!tokens.includes(tokenName.toUpperCase())) {
      setTokens((prevTokens) => [...prevTokens, tokenName.toUpperCase()]);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      tokens.forEach(fetchPrice);
    }, 3000);

    return () => clearInterval(interval);
  }, [tokens]);

  const getPrice = (tokenName: string): number | undefined => {
    return prices[tokenName.toUpperCase()];
  };

  return (
    <UsdtPriceContext.Provider value={{ getPrice, addToken }}>
      {children}
    </UsdtPriceContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUsdtPrice = (tokenName: string): number | undefined => {
  const context = useContext(UsdtPriceContext);
  if (!context) {
    throw new Error("useUsdtPrice must be used within a UsdtPriceProvider");
  }

  useEffect(() => {
    context.addToken(tokenName);
  }, [tokenName, context]);

  return context.getPrice(tokenName);
};
