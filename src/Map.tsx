import React, {useState, useEffect, useRef} from 'react';
import {YMaps, Map, Placemark, Polygon} from 'react-yandex-maps';
import {TextField, Typography} from '@mui/material';
import {useDebounce} from 'use-debounce'; // для оптимизации ввода

interface PolygonCoordinates {
    coordinates: number[][];
}

interface YandexMapComponentProps {
    polygons: PolygonCoordinates[];
}

const YandexMapComponent: React.FC<YandexMapComponentProps> = ({polygons}) => {
    const [map, setMap] = useState<ymaps.Map | null>(null);
    const [address, setAddress] = useState<string>('');
    const [debouncedAddress] = useDebounce(address, 500);
    const [suggestions, setSuggestions] = useState<ymaps.IGeocodeResult | null>(null);
    const [placemark, setPlacemark] = useState<ymaps.Placemark | null>(null);
    const [isIntersected, setIsIntersected] = useState<boolean>(false);
    const ymapsInstance = useRef<any>(null);

    useEffect(() => {
        if (debouncedAddress && ymapsInstance.current) {
            ymapsInstance.current.geocode(debouncedAddress).then((result: ymaps.IGeocodeResult) => {
                setSuggestions(result);
            });
        }
    }, [debouncedAddress]);

    const handleMapClick = (e: ymaps.IEvent) => {
        const coords = e.get('coords');
        if (placemark) {
            placemark.geometry.setCoordinates(coords);
        } else if (map) {
            const newPlacemark = new ymapsInstance.current.Placemark(coords, {
                iconCaption: 'поиск...'
            }, {
                preset: 'islands#violetDotIconWithCaption',
                draggable: true
            });
            newPlacemark.events.add('dragend', () => getAddress(newPlacemark.geometry.getCoordinates()));
            map.geoObjects.add(newPlacemark);
            setPlacemark(newPlacemark);
        }
        getAddress(coords);
    };

    const getAddress = (coords: number[]) => {
        if (placemark) {
            placemark.properties.set('iconCaption', 'поиск...');
        }
        ymapsInstance.current.geocode(coords).then((res: ymaps.IGeocodeResult) => {
            const firstGeoObject = res.geoObjects.get(0);
            if (placemark) {
                placemark.properties.set({
                    iconCaption: [
                        firstGeoObject.getLocalities().length ? firstGeoObject.getLocalities() : firstGeoObject.getAdministrativeAreas(),
                        firstGeoObject.getThoroughfare() || firstGeoObject.getPremise()
                    ].filter(Boolean).join(', '),
                    balloonContent: firstGeoObject.getAddressLine()
                });
            }
            setAddress(firstGeoObject.getAddressLine());
            checkIntersection(coords);
        });
    };

    const checkIntersection = (coords: number[]) => {
        const point = new ymapsInstance.current.GeoObject({
            geometry: {
                type: 'Point',
                coordinates: coords
            }
        });

        const polygonQuery = ymapsInstance.current.geoQuery(map?.geoObjects).search('geometry.type="Polygon"');
        const intersects = polygonQuery.searchIntersect(point).getLength() > 0;
        setIsIntersected(intersects);
    };

    const handleSuggestionClick = (address: string) => {
        setAddress(address);
        ymapsInstance.current.geocode(address).then((res: ymaps.IGeocodeResult) => {
            const coords = res.geoObjects.get(0).geometry.getCoordinates();
            if (map) {
                map.setCenter(coords, 10);
                handleMapClick({get: () => coords} as ymaps.IEvent);
            }
        });
    };

    return (
        <>
            <TextField
                label="Адрес"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                fullWidth
                margin="normal"
            />
            {suggestions && (
                <div>
                    {suggestions.geoObjects.toArray().map((geoObject, index) => (
                        <div key={index} onClick={() => handleSuggestionClick(geoObject.getAddressLine())}>
                            {geoObject.getAddressLine()}
                        </div>
                    ))}
                </div>
            )}
            <Typography variant="h6">
                {isIntersected ? 'Точка входит в область' : 'Точка не входит в область'}
            </Typography>

            <div>
                <YMaps
                    query={{
                        apikey: 'ваш API-ключ',
                        lang: 'ru_RU'
                    }}
                >
                    <Map
                        defaultState={{center: [55.753994, 37.622093], zoom: 9}}
                        width="100%"
                        height="400px"
                        onLoad={ymaps => (ymapsInstance.current = ymaps)}
                        onClick={handleMapClick}
                        instanceRef={setMap}
                    >
                        {polygons.map((polygon, index) => (
                            <Polygon
                                key={index}
                                geometry={[polygon.coordinates]}
                                options={{fillColor: '#00FF00', strokeColor: '#0000FF', opacity: 0.5}}
                            />
                        ))}
                        {placemark && (
                            <Placemark
                                geometry={placemark.geometry.getCoordinates()}
                                options={placemark.options}
                                properties={placemark.properties}
                            />
                        )}
                    </Map>
                </YMaps>
            </div>
        </>
    );
};

export default YandexMapComponent;
