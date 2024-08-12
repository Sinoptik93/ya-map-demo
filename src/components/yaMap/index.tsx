interface YaMapProps {
    apiKey: string;
    points?: Array<{ coordinates: [number, number] }>;
    areas?: Array<{ coordinates: Array<[number, number]> }>;
}


const YaMap = async ({ apiKey, points = [], areas = [] }: YaMapProps) => {
    return (
        <div>Map</div>
    )
};

export default YaMap;
