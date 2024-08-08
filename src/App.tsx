import Map from "./Map";
const polygons = [
    {
        coordinates: [
            [55.75, 37.8],
            [55.8, 37.9],
            [55.75, 38.0],
            [55.7, 37.9],
            [55.75, 37.8],
        ],
    },
    {
        coordinates: [
            [55.7, 37.5],
            [55.75, 37.6],
            [55.7, 37.7],
            [55.65, 37.6],
            [55.7, 37.5],
        ],
    },
];

const App = () => {


    return (
        <>
            <Map polygons={polygons} />
        </>
    );
};

export default App;
