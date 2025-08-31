import { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { searchNearbyPlaces } from "../utils/api";

export default function HomeScreen() {
  const [places, setPlaces] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const data = await searchNearbyPlaces(19.0760, 72.8777);
      setPlaces(data);
    })();
  }, []);

  return (
    <View>
      <Text>Nearby Tourist Spots</Text>
      <FlatList
        data={places}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Text>{item.displayName?.text || "No Name"}</Text>
        )}
      />
    </View>
  );
}
