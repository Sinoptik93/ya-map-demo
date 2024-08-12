import React, {useState, useEffect, useRef} from 'react';
import {YMaps, Map, Placemark, Polygon} from '@pbe/react-yandex-maps';
import {TextField, Typography, Autocomplete} from '@mui/material';
import {useDebounce} from 'use-debounce';
import {GeocodeResult, IEvent, IGeocodeResult, GeoObject, Map as IMap, ICircleGeometryAccess} from 'yandex-maps'

interface PolygonCoordinates {
    coordinates: number[][];
}

interface YandexMapComponentProps {
    polygons: PolygonCoordinates[];
}

const YandexMapComponent: React.FC<YandexMapComponentProps> = ({polygons}) => {
    const [map, setMap] = useState<IMap | null>(null);
    const [address, setAddress] = useState<string>('');
    const [debouncedAddress] = useDebounce(address, 500);
    const [suggestions, setSuggestions] = useState<{
        id: string;
        address: { components: { kind: string; name: string }, title: string };
        coords: { lng: number; lat: number }
    }[]>([]);
    const [placemark, setPlacemark] = useState<GeoObject | null>(null);
    const [isIntersected, setIsIntersected] = useState<boolean>(false);
    const ymapsInstance = useRef<typeof ymaps>(null);
    const [center, setCenter] = useState<[number, number]>([55.753994, 37.622093]);

    // const geoCoder = ymaps.geocode;
    //
    // console.log(geoCoder('Петропавловск').then(result => console.log(result)))

    useEffect(() => {
        if (debouncedAddress && ymapsInstance.current) {

            console.log(debouncedAddress)
            ymaps.geocode(debouncedAddress).then((result: IGeocodeResult) => {
                let suggestions: {
                    id: string;
                    address: { components: { kind: string; name: string }, title: string };
                    coords: { lng: number; lat: number }
                }[] = [];
                result.geoObjects.each(geoObject => {
                    if (!geoObject?.geometry) return;

                    const suggestion = geoObject?.geometry as unknown as ICircleGeometryAccess;
                    const [lat, lng] = suggestion.getCoordinates() as [number, number];

                    const {
                        Components,
                        formatted
                    } = geoObject.properties.get('metaDataProperty.GeocoderMetaData.Address', {}) as {
                        Components: { kind: string; name: string },
                        formatted: string
                    };

                    const formatedSuggestion = {
                        id: `${lat}-${lng}`,
                        address: {
                            components: Components,
                            title: formatted
                        },
                        coords: {
                            lat,
                            lng,
                        }
                    }

                    suggestions = [...suggestions, formatedSuggestion]
                })

                console.log({suggestions})

                setSuggestions(suggestions);
            });
        }
    }, [debouncedAddress]);

    const handleMapClick = (e: IEvent) => {
        console.log(e)
        const coords = e.get('coords');

        console.log(coords);
        // if (placemark) {
        //     placemark.geometry.setCoordinates(coords);
        // } else if (map) {
        //     const newPlacemark = new ymapsInstance.current.Placemark(coords, {
        //         iconCaption: 'поиск...'
        //     }, {
        //         preset: 'islands#violetDotIconWithCaption',
        //         draggable: true
        //     });
        //     newPlacemark.events.add('dragend', () => getAddress(newPlacemark.geometry.getCoordinates()));
        //     map.geoObjects.add(newPlacemark);
        //     setPlacemark(newPlacemark);
        // }
        // getAddress(coords);
    };

    const getAddressByCoords = async (coords: { lat: number; lng: number }) => {
        const response = await ymaps.geocode([coords.lat, coords.lng], {results: 1});
        const data: GeocodeResult = response.geoObjects.get(0);

        console.log({data: data.getAddressLine()})

        return {
            address: {
                title: data.getAddressLine(),
            },
            coords
        };
        // if (placemark) {
        //     placemark.properties.set({
        //         iconCaption: [
        //             firstGeoObject.getLocalities().length ? firstGeoObject.getLocalities() : firstGeoObject.getAdministrativeAreas(),
        //             firstGeoObject.getThoroughfare() || firstGeoObject.getPremise()
        //         ].filter(Boolean).join(', '),
        //         balloonContent: firstGeoObject.getAddressLine()
        //     });
        // }

        // if (placemark) {
        //     placemark.properties.set('iconCaption', 'поиск...');
        // }
        // ymapsInstance.current.geocode(coords).then((res: ymaps.IGeocodeResult) => {
        //     const firstGeoObject = res.geoObjects.get(0);
        //     if (placemark) {
        //         placemark.properties.set({
        //             iconCaption: [
        //                 firstGeoObject.getLocalities().length ? firstGeoObject.getLocalities() : firstGeoObject.getAdministrativeAreas(),
        //                 firstGeoObject.getThoroughfare() || firstGeoObject.getPremise()
        //             ].filter(Boolean).join(', '),
        //             balloonContent: firstGeoObject.getAddressLine()
        //         });
        //     }
        //     setAddress(firstGeoObject.getAddressLine());
        //     checkIntersection(coords);
        // });
    };
    //
    const checkIntersection = (coords: number[]) => {

        console.log({coords})
        // const point = new ymapsInstance.current.GeoObject({
        //     geometry: {
        //         type: 'Point',
        //         coordinates: coords
        //     }
        // });
        //
        // const polygonQuery = ymapsInstance.current.geoQuery(map?.geoObjects).search('geometry.type="Polygon"');
        // const intersects = polygonQuery.searchIntersect(point).getLength() > 0;
        // setIsIntersected(intersects);
    };
    //
    const handleSuggestionClick = async (option: {
        id: string,
        label: string,
        coords: { lat: number; lng: number }
    } | null) => {
        if (!option) return;

        setAddress(option.label);

        const addressClick = await getAddressByCoords(option.coords)

        console.log(addressClick)

        setAddress(addressClick.address.title)
        setCenter([addressClick.coords.lat, addressClick.coords.lng])

        const placeMark = new ymaps.Placemark([addressClick.coords.lat, addressClick.coords.lng], {
            balloonContentHeader: "Балун метки",
            balloonContentBody: "Содержимое <em>балуна</em> метки",
            balloonContentFooter: "Подвал",
            hintContent: "Хинт метки"
        });

        console.log('ymaps.Map')
        ymaps.geoObject.add(placeMark)

        // ymapsInstance.current.geocode(address).then((res: ymaps.IGeocodeResult) => {
        //     const coords = res.geoObjects.get(0).geometry.getCoordinates();
        //     if (map) {
        //         map.setCenter(coords, 10);
        //         handleMapClick({get: () => coords} as ymaps.IEvent);
        //     }
        // });
    };

    return (
        <>
            <Autocomplete
                options={suggestions.map((suggestion) => ({
                    id: suggestion.id,
                    label: suggestion.address.title,
                    coords: suggestion.coords
                }))}
                onChange={(e, option) => handleSuggestionClick(option)}
                renderInput={(params) => <TextField
                    label="Адрес"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    margin="normal"
                    {...params}
                />}
            />
            <Typography variant="h6">
                {isIntersected ? 'Точка входит в область' : 'Точка не входит в область'}
            </Typography>

            <div>
                <YMaps
                    query={{
                        apikey: '9bc7964f-5b78-4231-bd66-5021a7d9ff85',
                        lang: 'ru_RU',
                    }}
                >
                    <Map
                        defaultState={{center, zoom: 9}}
                        width="100%"
                        height="400px"
                        state={{center}}
                        onLoad={ymaps => (ymapsInstance.current = ymaps)}
                        onClick={handleMapClick}
                        instanceRef={setMap}
                    >
                        {polygons.map((polygon, index) => (
                            <Polygon
                                onClick={(e) => console.log(e.get('coords'))}
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
