'use client'
import { GoogleMap } from '@react-google-maps/api';
import styles from './MapDemonstration.module.scss';
import { type GoogleMapProps } from '@react-google-maps/api';
import { useRef, useState } from 'react';
import { Legend } from '../Legend/Legend';
import { SmokeScreen } from '../SmokeScreen/SmokeScreen';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

interface PointData {
  lat: number,
  lng: number,
  data: number
}

interface ApiIncorrectResponse {
  ok: false,
  message: string
}

interface ApiCorrectResponse {
  ok: true,
  result: PointData[]
}

type ApiResponse = ApiCorrectResponse | ApiIncorrectResponse;

const isApiCorrectResponse = (response: ApiResponse): response is ApiCorrectResponse => {
  return response.ok === true;
}

const radius = 400;
const opacity = 0.7;

interface Loading {
  soc: boolean,
  sand: boolean,
  clay: boolean
}

type Compound = '' | 'SOC stock' | 'Sand' | 'Clay'

interface CompoundInfo<T extends Compound> {
  compound: T
  unit: T extends '' ? '' : T extends 'SOC stock' ? 't/ha' : 'mass %' 
}

export const MapDemonstration = () => {

  const [mapCenter, setMapCenter] = useState<google.maps.LatLng>(new google.maps.LatLng(40.41831, -3.70275));
  const mapRef = useRef<google.maps.Map | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const [polygon, setPolygon] = useState<google.maps.Polygon>(new google.maps.Polygon());
  const [heatMap, setHeatMap] = useState<google.maps.visualization.HeatmapLayer>(new google.maps.visualization.HeatmapLayer({
    data: [],
    dissipating: true,
    opacity,
  }));
  const [legendMinMax, setLegendMinMax] = useState({
    min: 0,
    max: 0
  });
  const [loading, setLoading] = useState<Loading>({
    soc: false,
    sand: false,
    clay: false
  });
  const anyIsLoading = loading.soc || loading.sand || loading.clay;
  const [compound, setCompound] = useState<CompoundInfo<Compound>>({
    compound: '',
    unit: ''
  })

  const handleMapLoad = (ref: google.maps.Map | null) => {
    mapRef.current = ref;
    mapRef.current?.setMapTypeId('hybrid');
    mapRef.current?.setCenter(mapCenter);
  }

  const getHeatMapRadius = (zoom: number) => {
    return 5.5 * 2 ** (zoom - 14);
  }

  const GoogleMapsInitProps: GoogleMapProps = {
    id: 'google-map-script',
    onLoad: (ref) => {
      if (handleMapLoad !== undefined) {
        handleMapLoad(ref)
      }
      const newHeatMap = heatMap;
      newHeatMap.setMap(mapRef.current)
      setHeatMap(newHeatMap);
    },
    onZoomChanged: () => {
      const newHeatMap = heatMap;
      newHeatMap.setOptions({
        radius: getHeatMapRadius(mapRef.current?.getZoom() ?? 14)
      });
      setHeatMap(newHeatMap);
    },
    mapContainerStyle: {
      width: '100%',
      height: '100%'
    },
    center: mapCenter,
    zoom: 6,
    options: {
      disableDefaultUI: true
    }
  }

  const drawPolygon = (coords: [number, number][]) => {

    const paths = coords.map(pair => new google.maps.LatLng(pair[1], pair[0]));
    const newPoly = new google.maps.Polygon({
      paths: paths,
      strokeColor: '#000',
      strokeWeight: 3,
      strokeOpacity: 1,
      fillOpacity: 0
    });

    if (JSON.stringify(newPoly.getPaths()) !== JSON.stringify(polygon.getPaths())) {
      polygon.setMap(null);
      setPolygon(newPoly);
      newPoly.setMap(mapRef.current)
      const bounds = new google.maps.LatLngBounds()
      paths.forEach(vertex => {
        bounds.extend(vertex)
      });
      const center = bounds.getCenter();
      setMapCenter(center);
      mapRef.current?.fitBounds(bounds)
    }
  }

  const handleFetchInfo = async (endpoint: string) => {
    const strCoords = textAreaRef.current?.value
    if (strCoords !== '' && strCoords !== undefined) {
      const coords = JSON.parse(strCoords);
      drawPolygon(coords);
      const payload = JSON.stringify({
        coords
      });
      const response = await fetch((process.env.NEXT_PUBLIC_ROOT_URL + endpoint), {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: payload
      });
      const objResult: ApiResponse = await response.json();

      if (isApiCorrectResponse(objResult)) {
        const weights = objResult.result.map(obj => obj.data);
        const originalMin = Math.min(...weights);
        const originalMax = Math.max(...weights);
        const newMin = 0;
        const newMax = 100;

        setLegendMinMax({
          min: parseFloat(originalMin.toFixed(2)),
          max: parseFloat(originalMax.toFixed(2))
        });

        const reescaled = objResult.result.map(value => {
          return {
            lat: value.lat,
            lng: value.lng,
            data: ((value.data - originalMin) / (originalMax - originalMin)) * (newMax - newMin) + newMin
          }
        });

        const heatMapData = reescaled.map(point => {
          return {
            location: new google.maps.LatLng(point.lat, point.lng),
            weight: point.data
          }
        });

        const newHeatMap = heatMap;
        newHeatMap.setData(heatMapData);
        setHeatMap(newHeatMap);
      }
    }
  }

  const handleSocClick = async () => {
    setLoading({
      ...loading,
      soc: true
    });
    await handleFetchInfo('/api/soc');
    setCompound({
      compound: 'SOC stock',
      unit: 't/ha'
    });
    setLoading({
      ...loading,
      soc: false
    });
  }

  const handleSandClick = async () => {
    setLoading({
      ...loading,
      sand: true
    });
    await handleFetchInfo('/api/sand');
    setCompound({
      compound: 'Sand',
      unit: 'mass %'
    });
    setLoading({
      ...loading,
      sand: false
    });
  }

  const handleClayClick = async () => {
    setLoading({
      ...loading,
      clay: true
    });
    await handleFetchInfo('/api/clay');
    setCompound({
      compound: 'Clay',
      unit: 'mass %'
    });
    setLoading({
      ...loading,
      clay: false
    });
  }

  return (
    <main className={styles.MapDemonstration}>
      <section>
        <SmokeScreen show={anyIsLoading} />
        {legendMinMax.min === 0 && legendMinMax.max === 0 ? null : <Legend compound={compound.compound} unit={compound.unit} min={legendMinMax.min} max={legendMinMax.max} />}
        <GoogleMap {...GoogleMapsInitProps} />
      </section>
      <section>
        <textarea ref={textAreaRef} rows={10}></textarea>
        <button onClick={handleSocClick} disabled={anyIsLoading}>{loading.soc ? <FontAwesomeIcon icon={faSpinner} spin /> : 'SOC stock'}</button>
        <button onClick={handleSandClick} disabled={anyIsLoading}>{loading.sand ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Sand'}</button>
        <button onClick={handleClayClick} disabled={anyIsLoading}>{loading.clay ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Clay'}</button>
      </section>
    </main>
  )
}
