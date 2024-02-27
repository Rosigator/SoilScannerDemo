'use client'
import styles from "./page.module.scss";
import { useJsApiLoader } from '@react-google-maps/api';
import { type Libraries } from '@react-google-maps/api/dist/utils/make-load-script-url';
import { useState } from 'react';
import { MapDemonstration } from "@/components/MapDemonstration/MapDemonstration";

const Home = () => {

  // Si no lo cargas así, da un error estúpido con el JSApiLoader
  const [libraries] = useState<Libraries>(['marker', 'geometry', 'visualization']);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? '',
    libraries,
    version: 'beta'
  });

  return (
    <main className={styles.main}>
      {isLoaded ? <MapDemonstration /> : null}
    </main>
  );
}

export default Home;