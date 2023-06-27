import {useRouter} from "next/router";
import {number} from "prop-types";
import {ChangeEvent} from "react";

interface IStatus {
  timestamp: string,
  error_code: number,
  error_message: string,
  elapsed: number,
  credit_count: number,
  notice: string
}

interface IConversion {
  symbol: string,
  id: number,
  name: string,
  amount: number,
  last_updated: string,
  quote: {
    [number]: {
      price: number,
      last_updated:string
    }
  }
}
interface IConversionResp {
  data: IConversion,
  status: IStatus
}

interface ICurrency {
  id: number,
  rank: number,
  name: string,
  symbol: string,
  slug: string,
  is_active: number,
  first_historical_data: string,
  last_historical_data: string,
  platform: null
}

interface ICurrencyResp {
  data: ICurrency,
  status: IStatus
}

interface IHomeProps {
  data: {
    conversion: IConversion,
    currencies: ICurrency[]
  }
}
export default function Home({data}: IHomeProps) {
  const router = useRouter();
  const id = router.query.id;
  const convert_id = router.query.convert_id;

  const price = data.conversion?.quote?.[convert_id]?.price;
  const nameFrom = data.conversion?.name + " (" + data.conversion?.symbol + ")";
  const nameToObj = data.currencies?.find((item: ICurrency) => item.id?.toString() === (convert_id ?? "1"));
  const nameTo = nameToObj?.name + " (" + nameToObj?.symbol + ")";


  const handleChangeFrom = async (e: ChangeEvent<HTMLSelectElement>) => {
    await router.push({
      query: {...router.query, id: e.target.value},
    })
  }
  const handleChangeTo = async (e: ChangeEvent<HTMLSelectElement>) => {
    await router.push({
      query: {...router.query, convert_id: e.target.value},
    })
  }


  return (
    <main className="flex justify-center items-center h-screen">
      <div className="w-1/2">
        <h1 className="mb-10 text-center text-lg font-bold">Cryptocurrency Converter</h1>
        <div className="flex h-fit gap-3">
          <select id="currency1" onChange={handleChangeFrom} defaultValue={id}
                  className="bg-gray-50 border border-gray-300 focus-visible:outline-none text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
            {data.currencies?.map((item: ICurrency) => (
              <option id={item.id?.toString()} value={item.id} key={item.id}>{item.symbol}</option>
            ))}
          </select>
          <select id="currency2" defaultValue={convert_id} onChange={handleChangeTo}
                  className="bg-gray-50 border border-gray-300 focus-visible:outline-none text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
            {data.currencies?.map((item: ICurrency) => (
              <option id={item.id?.toString()} value={item.id} key={item.id}>{item.symbol}</option>
            ))}
          </select>
        </div>
        <div className="text-center mt-5 ">1 {nameFrom} = {price} {nameTo}</div>
      </div>
    </main>
  )
}
export const getServerSideProps = async (context) => {
  const {
    query: {convert_id = "1", id = "1"},
  } = context;

  const headers = {
    'X-CMC_PRO_API_KEY': process.env.X_CMC_PRO_API_KEY,
    'Access-Control-Allow-Origin': 'http://localhost:3000'
  }

  const currenciesData = await fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?limit=30&sort=cmc_rank`, {headers});
  const currencies: ICurrencyResp = await currenciesData.json();
  if (!currenciesData.ok) {
    throw new Error(`Failed to fetch currencies, received status ${currenciesData.status}`)
  }

  const conversionData = await fetch(`https://pro-api.coinmarketcap.com/v2/tools/price-conversion?amount=1&convert_id=${convert_id}&id=${id}`, {headers})
  const conversion: IConversionResp = await conversionData.json();
  if (!conversionData.ok) {
    throw new Error(`Failed to fetch conversion, received status ${currenciesData.status}`)
  }

  if (conversion.status.error_code || currencies.status.error_code) {
    return {
      notFound: true,
    };
  }

  return {
    props:
      {
        data: {
          currencies: currencies.data,
          conversion: conversion.data
        },
      }
  }
}