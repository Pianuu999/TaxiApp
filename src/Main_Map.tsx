/* eslint-disable jsx-quotes */
/* eslint-disable eqeqeq */
/* eslint-disable quotes */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/react-in-jsx-scope */
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useState, useRef } from 'react';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import api from './API';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation, ParamListBase } from "@react-navigation/native";

function Main_Map(): JSX.Element {
  console.log('-- Main_Map()');

  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  const callTaxi = async () => {
    let userId = await AsyncStorage.getItem('userId') || "";
    let startAddr = autoComplete1.current.getAddressText();
    let endAddr = autoComplete2.current.getAddressText();

    let startLat = `${marker1.latitude}`;
    let startLng = `${marker1.longitude}`;
    let endLat = `${marker2.latitude}`;
    let endLng = `${marker2.longitude}`;

    if (!(startAddr && endAddr)) {
      Alert.alert("알림", "출발지/도착지 모두 입력되어야합니다.", [
        { text: '확인', style: 'cancel' },
      ]);
      return;
    }
    api.call(userId, startLat, startLng, startAddr, endLat, endLng, endAddr)
      .then(response => {
        let { code, message } = response.data[0];
        let title = "알림";
        if (code == 0) {
          navigation.navigate("Main_List");
        }
        else {
          title = "오류";
        }

        Alert.alert(title, message, [
          { text: '확인', style: 'cancel' },
        ]);
      })
      .catch(err => {
        console.log(JSON.stringify(err));
      });
  };

  const [showBtn, setShowBtn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedLatLng, setSelectedLatLng] = useState(
    { latitude: 0, longitude: 0 }
  );
  const [selectedAddress, setSelectedAddress] = useState('');


  const handleLongPress = async (event: any) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLatLng(coordinate);

    setShowBtn(true);
    setLoading(true);  // Loading 상태를 true로 설정해야 로딩 화면이 뜨도록 수정

    api.geoCoding(coordinate, query.key)
      .then(response => {
        setSelectedAddress(response.data.results[0].formatted_address);
        setShowBtn(true);
        setLoading(false); // 로딩 상태를 false로 설정
      })
      .catch(err => {
        console.log(JSON.stringify(err));
        setLoading(false); // 에러가 발생해도 로딩 상태 해제
      });
  };

  const [initialRegion, setInitialRegion] = useState({
    latitude: 37.5665, // 여기에 원하는 위치 좌표를 입력하세요
    longitude: 126.9780, // 서울을 예시로 사용
    latitudeDelta: 0.09,
    longitudeDelta: 0.04,
  });

  let query = {
    key: "AIzaSyCa0Z8_syW8AEL0P4bfV0Sj0vKeBF5ngBA",
    language: "ko",
    components: "country:kr",
  };

  const [marker1, setMarker1] = useState({ latitude: 0, longitude: 0 });
  const [marker2, setMarker2] = useState({ latitude: 0, longitude: 0 });

  const mapRef: any = useRef(null);



  const onSelectAddr = (data: any, details: any, type: string) => {
    if (details) {
      let lat = details.geometry.location.lat;
      let lng = details.geometry.location.lng;

      if (type == "start") {
        setMarker1({ latitude: lat, longitude: lng });
        if (marker2.longitude == 0) {
          setInitialRegion({
            latitude: lat, longitude: lng,
            latitudeDelta: 0.0073, longitudeDelta: 0.0064,
          });
        }
      } else {
        setMarker2({ latitude: lat, longitude: lng });
        if (marker1.longitude == 0) {
          setInitialRegion({
            latitude: lat, longitude: lng,
            latitudeDelta: 0.0073, longitudeDelta: 0.0064,
          });
        }
      }
    }
  };

  if (marker1.latitude != 0 && marker2.longitude != 0) {
    if (mapRef.current) {
      mapRef.current.fitToCoordinates([marker1, marker2], {
        edgePadding: { top: 120, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }
  const autoComplete1: any = useRef(null);
  const autoComplete2: any = useRef(null);

  const handleAddMarker = (title: string) => {
    if (selectedAddress) {
      if (title == "출발지") {
        setMarker1(selectedLatLng);
        if (autoComplete1.current) {
          autoComplete1.current.setAddressText(selectedAddress);
        }
      } else {
        setMarker2(selectedLatLng);
        if (autoComplete2.current) {
          autoComplete2.current.setAddressText(selectedAddress);
        }
      }
      setShowBtn(false);
    }
  };

  const setMyLocation = () => {
    setLoading(true);
    Geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;

      let coords = { latitude, longitude };
      setMarker1(coords);
      setInitialRegion({
        latitude: 0, longitude: 0,
        latitudeDelta: 0, longitudeDelta: 0,
      });
      setInitialRegion({
        latitude: latitude, longitude: longitude,
        latitudeDelta: 0.0073, longitudeDelta: 0.0064,
      });

      api.geoCoding(coords, query.key)
        .then(response => {
          let addr = response.data.results[0].formatted_address;
          autoComplete1.current.setAddressText(addr);
          setLoading(false);
        })
        .catch(err => {
          console.log(JSON.stringify(err));
          setLoading(false);
        });
    },
      (error) => {
        setLoading(false);
        console.log("!!!! 오류 발생 / error = " + JSON.stringify(error));
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 1000,
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/** 지도 */}
      <MapView
        style={styles.container}
        provider={PROVIDER_GOOGLE}
        region={initialRegion}
        onPress={() => { setShowBtn(false); }}
        ref={mapRef}
        onLongPress={handleLongPress}>
        <Marker coordinate={marker1} title="출발 위치" />
        <Marker coordinate={marker2} title="도착 위치" pinColor='blue' />
        {marker1.latitude != 0 && marker2.longitude != 0 && (
          <Polyline
            coordinates={[marker1, marker2]}
            strokeColor='blue' strokeWidth={3} />
        )}
      </MapView>

      <View style={{ position: 'absolute', width: '100%', height: '100%', padding: 10 }}>

        {/* 출발지 / 도착지 입력 박스 */}
        <View style={{ position: 'absolute', padding: wp(2) }}>

          <View style={{ width: wp(75) }}>
            <GooglePlacesAutocomplete ref={autoComplete1}
              onPress={(data, details) => onSelectAddr(data, details, 'start')}
              minLength={2}
              placeholder="출발지 검색"
              query={query}
              keyboardShouldPersistTaps={"handled"}
              fetchDetails={true}
              enablePoweredByContainer={false}
              onFail={(error) => console.log(error)}
              onNotFound={() => console.log("no results")}
              styles={autocompleteStyles}
            />
          </View>
          <View style={{ width: wp(75) }}>
            <GooglePlacesAutocomplete ref={autoComplete2}
              onPress={(data, details) => onSelectAddr(data, details, 'end')}
              minLength={2}
              placeholder="도착지 검색"
              query={query}
              keyboardShouldPersistTaps={"handled"}
              fetchDetails={true}
              enablePoweredByContainer={false}
              onFail={(error) => console.log(error)}
              onNotFound={() => console.log("no results")}
              styles={autocompleteStyles}
            />
          </View>
        </View>
      </View>
      <TouchableOpacity style={[styles.button, {
        position: 'absolute', width: wp(18),
        top: wp(2), right: wp(2), height: 90, justifyContent: 'center',
      }]}
        onPress={callTaxi}
      >
        <Text style={styles.buttonText}>호출</Text>
      </TouchableOpacity>
      {/** 내 위치 버튼 */}
      <TouchableOpacity style={[{ position: 'absolute', bottom: 20, right: 20 }]}
        onPress={setMyLocation}>
        <Icon name="crosshair" size={40} color={'#3498db'} />
      </TouchableOpacity>

      {showBtn && (
        <View
          style={{
            position: 'absolute',
            top: hp(50),
            left: wp(50) - 75,
            height: 90,
            width: 150,
          }}>
          <TouchableOpacity
            style={[styles.button, { flex: 1, marginVertical: 1 }]}
            onPress={() => handleAddMarker('출발지')}>
            <Text style={styles.buttonText}>출발지로 등록</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { flex: 1 }]}
            onPress={() => handleAddMarker('도착지')}>
            <Text style={styles.buttonText}>도착지로 등록</Text>
          </TouchableOpacity>
        </View>
      )}
      <Modal transparent={true} visible={loading}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Icon name="spinner" size={50} color="blue" />
          <Text style={{ backgroundColor: 'white', color: 'black', height: 20 }}>Loading . . .</Text>
        </View>
      </Modal>


    </SafeAreaView>
  );
}
const autocompleteStyles = StyleSheet.create({
  textInputContainer: {
    width: '100%',
    backgroundColor: '#e9e9e9',
    borderRadius: 8,
    height: 40,
  },
  TextInput: {
    height: 40,
    color: '#5d5d5d',
    fontSize: 16,
  },
  predefinedPlacesDescription: {
    color: '#1faadb',
    zIndex: 1,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderWidth: 2,
    borderColor: 'gray',
    marginVertical: 1,
    padding: 10,
  },
});

export default Main_Map;
