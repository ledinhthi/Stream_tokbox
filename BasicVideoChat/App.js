
import React, { Component } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Dimensions,
  Button,
  TouchableOpacity,
  Image,
  TextInput,
  LogBox
} from 'react-native';
import {
  OT,
  OTSession,
  OTPublisher,
  OTSubscriber,
  OTSubscriberView,
} from 'opentok-react-native';

import RNSketchCanvas from '@terrylinla/react-native-sketch-canvas';
import Video from 'react-native-video';
import { SafeAreaView } from 'react-native-safe-area-context';

const dimensions = {
  width: Dimensions.get('window').width,
  height: Dimensions.get('window').height,
};

const mainSubscribersResolution = { width: 1280, height: 720 };
const secondarySubscribersResolution = { width: 352, height: 288 };

// Call each other, screen sharing,
//(Show text(Text input), line art(react - native - paint), video(show local video))

class App extends Component {
  constructor(props) {
    super(props);
    this.apiKey = "45828062";
    this.sessionId = '1_MX40NTgyODA2Mn5-MTYzNzE2MDU1Mjk2OX5vbVBsaGtERE0xd0RMTnpMOEltS3NEd1h-UH4';
    this.token = 'T1==cGFydG5lcl9pZD00NTgyODA2MiZzaWc9NTI0YjM1OTUyN2JkYmY3ZDY2NzUzYWFkMjljOGMxYzI4MmE4ZjZlZDpzZXNzaW9uX2lkPTFfTVg0ME5UZ3lPREEyTW41LU1UWXpOekUyTURVMU1qazJPWDV2YlZCc2FHdEVSRTB4ZDBSTVRucE1PRWx0UzNORWQxaC1VSDQmY3JlYXRlX3RpbWU9MTYzNzE2NzMxMiZub25jZT0wLjcxNTY0NTAzNzc2MTQ2Nzgmcm9sZT1wdWJsaXNoZXImZXhwaXJlX3RpbWU9MTYzNzI1MzcxMg==';
    this.state = {
      subscriberIds: [], // Array for storing subscribers
      localPublishAudio: true, // Local Audio state
      localPublishVideo: true, // Local Video state
      joinCall: false, // State variable for storing success
      streamProperties: {}, // Handle individual stream properties,
      mainSubscriberStreamId: null,
      showScreenMode: 2, // 0, 1, 2: 0, 1, 2: guest
      showFeatures: false,
      toolType: 0, // 0: Text, 1: line, 2: Video
      publisherProperties: {
        videoSource: 'screen',
        videoContentHint: 'text',
        resolution: '1280x720',
        frameRate: 30,
        audioBitrate: 64000,
      }
    };

    this.sessionEventHandlers = {
      streamCreated: (event) => {
        const streamProperties = {
          ...this.state.streamProperties,
          [event.streamId]: {
            subscribeToAudio: true,
            subscribeToVideo: true,
          },
        };
        this.setState({
          streamProperties,
          subscriberIds: [...this.state.subscriberIds, event.streamId],
        });
        console.log('streamCreated', this.state);
      },
      streamDestroyed: (event) => {
        const indexToRemove = this.state.subscriberIds.indexOf(event.streamId);
        const newSubscriberIds = this.state.subscriberIds;
        const streamProperties = { ...this.state.streamProperties };
        if (indexToRemove !== -1) {
          delete streamProperties[event.streamId];
          newSubscriberIds.splice(indexToRemove, 1);
          this.setState({ subscriberIds: newSubscriberIds });
        }
      },
      error: (error) => {
        console.log('session error:', error);
      },
      otrnError: (error) => {
        console.log('Session otrnError error:', error);
      },
      sessionDisconnected: () => {
        this.setState({
          streamProperties: {},
          subscriberIds: [],
        });
      },
    };

    this.publisherEventHandlers = {
      streamCreated: (event) => {
        console.log('Publisher stream created!', event);
      },
      streamDestroyed: (event) => {
        console.log('Publisher stream destroyed!', event);
      },
      audioLevel: (event) => {
        /* console.log('AudioLevel', typeof event); */
      },
    };

    this.subscriberEventHandlers = {
      connected: () => {
        console.log('[subscriberEventHandlers - connected]');
      },
      disconnected: () => {
        console.log('[subscriberEventHandlers - disconnected]');
      },
      error: (error) => {
        console.log('subscriberEventHandlers error:', error);
      },
    };


  }
  componentDidMount() {
    LogBox.ignoreAllLogs()
  }
  toggleAudio = () => {
    // let publishAudio = this.state.localPublishAudio;
    // this.publisherProperties = {
    //   ...this.publisherProperties,
    //   publishAudio: !publishAudio,
    // };
    // this.setState({
    //   localPublishAudio: !publishAudio,
    // });
    this.setState({
      showGuestContent: !this.state.showGuestContent
    })
  };

  // toggleVideo = () => {
  //   let publishVideo = this.state.localPublishVideo;
  //   this.publisherProperties = {
  //     ...this.publisherProperties,
  //     publishVideo: !publishVideo,
  //   };
  //   this.setState({
  //     localPublishVideo: !publishVideo,
  //   });
  //   console.log('Video toggle', this.publisherProperties);
  // };

  joinCall = () => {
    const { joinCall } = this.state;
    if (!joinCall) {
      this.setState({ joinCall: true });
    }
  };

  endCall = () => {
    const { joinCall } = this.state;
    if (joinCall) {
      this.setState({ joinCall: !joinCall });
    }
  };

  /**
   * // todo check if the selected is a publisher. if so, return
   * @param {*} subscribers
   */
  handleSubscriberSelection = (subscribers, streamId) => {
    console.log('handleSubscriberSelection', streamId);
    let subscriberToSwap = subscribers.indexOf(streamId);
    let currentSubscribers = subscribers;
    let temp = currentSubscribers[subscriberToSwap];
    currentSubscribers[subscriberToSwap] = currentSubscribers[0];
    currentSubscribers[0] = temp;
    this.setState((prevState) => {
      const newStreamProps = { ...prevState.streamProperties };
      for (let i = 0; i < currentSubscribers.length; i += 1) {
        if (i === 0) {
          newStreamProps[currentSubscribers[i]] = {
            ...prevState.streamProperties[currentSubscribers[i]],
          };
          newStreamProps[
            currentSubscribers[i]
          ].preferredResolution = mainSubscribersResolution;
        } else {
          newStreamProps[currentSubscribers[i]] = {
            ...prevState.streamProperties[currentSubscribers[i]],
          };
          newStreamProps[
            currentSubscribers[i]
          ].preferredResolution = secondarySubscribersResolution;
        }
      }
      console.log('mainSubscriberStreamId', streamId);
      console.log('streamProperties#2', newStreamProps);
      return {
        mainSubscriberStreamId: streamId,
        streamProperties: newStreamProps,
      };
    });
  };

  handleScrollEnd = (event, subscribers) => {
    console.log('handleScrollEnd', event.nativeEvent); // event.nativeEvent.contentOffset.x
    console.log('handleScrollEnd - events', event.target); // event.nativeEvent.contentOffset.x
    let firstVisibleIndex;
    if (
      event &&
      event.nativeEvent &&
      !isNaN(event.nativeEvent.contentOffset.x)
    ) {
      firstVisibleIndex = parseInt(
        event.nativeEvent.contentOffset.x / (dimensions.width / 2),
        10,
      );
      console.log('firstVisibleIndex', firstVisibleIndex);
    }
    this.setState((prevState) => {
      const newStreamProps = { ...prevState.streamProperties };
      if (firstVisibleIndex !== undefined && !isNaN(firstVisibleIndex)) {
        for (let i = 0; i < subscribers.length; i += 1) {
          if (i === firstVisibleIndex || i === firstVisibleIndex + 1) {
            newStreamProps[subscribers[i]] = {
              ...prevState.streamProperties[subscribers[i]],
            };
            newStreamProps[subscribers[i]].subscribeToVideo = true;
          } else {
            newStreamProps[subscribers[i]] = {
              ...prevState.streamProperties[subscribers[i]],
            };
            newStreamProps[subscribers[i]].subscribeToVideo = false;
          }
        }
      }
      return { streamProperties: newStreamProps };
    });
  };

  renderSubscribers = (subscribers) => {
    console.log('renderSubscribers', subscribers);
    console.log('this.state.subscriberIds', this.state.subscriberIds);
    console.log(
      'this.state.mainSubscriberStreamId',
      this.state.mainSubscriberStreamId,
    );
    if (this.state.mainSubscriberStreamId) {
      subscribers = subscribers.filter(
        (sub) => sub !== this.state.mainSubscriberStreamId,
      );
      subscribers.unshift(this.state.mainSubscriberStreamId);
    }
    console.log('renderSubscribers - sorted', subscribers);
    return subscribers.length > 1 ? (
      <>
        <View style={styles.mainSubscriberStyle}>
          <View
            onPress={() =>
              this.handleSubscriberSelection(subscribers, subscribers[0])
            }
            key={subscribers[0]}>
            <OTSubscriberView
              streamId={subscribers[0]}
              style={{
                width: '100%',
                height: '100%',
              }}
            />
          </View>
        </View>

        <View style={styles.secondarySubscribers}>
          <ScrollView
            horizontal={true}
            decelerationRate={0}
            snapToInterval={dimensions.width / 2}
            snapToAlignment={'center'}
            onScrollEndDrag={(e) =>
              this.handleScrollEnd(e, subscribers.slice(1))
            }
            style={{
              width: dimensions.width,
              height: dimensions.height / 4,
            }}>
            {subscribers.slice(1).map((streamId) => (
              <View
                onPress={() =>
                  this.handleSubscriberSelection(subscribers, streamId)
                }
                style={{
                  width: dimensions.width / 2,
                  height: dimensions.height / 4,
                }}
                key={streamId}>
                <OTSubscriberView
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                  key={streamId}
                  streamId={streamId}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </>
    ) : subscribers.length > 0 ? (
      <View style={styles.fullView}>
        <OTSubscriberView
          streamId={subscribers[0]}
          key={subscribers[0]}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
    ) : (
      <Text>No one connected</Text>
    );
  };
  onPressFeature = () => {
    this.setState({ showFeatures: !this.state.showFeatures })
  }

  onChooseTool = (type) => {
    this.setState({
      toolType: type,
      showFeatures: false,
      publisherProperties: {
        ...this.state.publisherProperties,
        videoContentHint: type == 0 ? 'text' : type == 1 ? 'detail' : 'motion'
      },
    }, () => {
      console.log("ToolType", this.state.toolType, this.state.publisherProperties)
    })
  }
  // Text, Video, Line art
  videoView = () => {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.fullView, { backgroundColor: 'white' }]}>
          <OTSession
            apiKey={this.apiKey}
            sessionId={this.sessionId}
            token={this.token}
            eventHandlers={this.sessionEventHandlers}
            options={{ enableStereoOutput: true }}>
            {((this.state.showScreenMode == 1) || (this.state.showScreenMode == 0)) && <OTPublisher
              properties={this.state.publisherProperties}
              eventHandlers={this.publisherEventHandlers}
              style={(this.state.showScreenMode == 0) ? styles.publisherStyle : null}
            />
            }
            {((this.state.showScreenMode == 2) || (this.state.showScreenMode == 0)) && <OTSubscriber
              style={{ height: dimensions.height, width: dimensions.width }}
              eventHandlers={this.subscriberEventHandlers}
              streamProperties={this.state.streamProperties}>
              {this.renderSubscribers}
            </OTSubscriber>
            }
          </OTSession>
        </View>

        {/* Publish Show text, video, brush */}
        {this.state.showScreenMode == 1 && this.state.toolType == 0 ?
          <TextInput style={{
            borderColor: 'black',
            borderWidth: 1,
            borderRadius: 10,
            top: Dimensions.get("screen").height / 2 - 150,
            bottom: 0,
            position: 'absolute',
            left: 0, right: 0,
            height: 300,
            marginHorizontal: 20,
            paddingVertical: 30,
            paddingHorizontal: 20
          }}
            multiline={true}
          >
          </TextInput>
          : this.state.showScreenMode == 1 && this.state.toolType == 1 ?
            <RNSketchCanvas
              containerStyle={{ backgroundColor: 'transparent', flex: 1, position: 'absolute', left: 0, right: 0, top: 30, bottom: 30 }}
              canvasStyle={{ backgroundColor: 'transparent', flex: 1, position: 'absolute', left: 0, right: 0, top: 30, bottom: 30 }}
              defaultStrokeIndex={0}
              defaultStrokeWidth={5}
              closeComponent={<View style={styles.functionButton}><Text style={{ color: 'white' }}>Close</Text></View>}
              undoComponent={<View style={styles.functionButton}><Text style={{ color: 'white' }}>Undo</Text></View>}
              clearComponent={<View style={styles.functionButton}><Text style={{ color: 'white' }}>Clear</Text></View>}
              eraseComponent={<View style={styles.functionButton}><Text style={{ color: 'white' }}>Eraser</Text></View>}
              strokeComponent={color => (
                <View style={[{ backgroundColor: color }, styles.strokeColorButton]} />
              )}
              strokeSelectedComponent={(color, index, changed) => {
                return (
                  <View style={[{ backgroundColor: color, borderWidth: 2 }, styles.strokeColorButton]} />
                )
              }}
              strokeWidthComponent={(w) => {
                return (<View style={styles.strokeWidthButton}>
                  <View style={{
                    backgroundColor: 'white', marginHorizontal: 2.5,
                    width: Math.sqrt(w / 3) * 10, height: Math.sqrt(w / 3) * 10, borderRadius: Math.sqrt(w / 3) * 10 / 2
                  }} />
                </View>
                )
              }}
              saveComponent={<View style={styles.functionButton}><Text style={{ color: 'white' }}>Save</Text></View>}
              savePreference={() => {
                return {
                  folder: 'RNSketchCanvas',
                  filename: String(Math.ceil(Math.random() * 100000000)),
                  transparent: false,
                  imageType: 'png'
                }
              }}
            />
            : this.state.showScreenMode == 1 && this.state.toolType == 2 && <Video
              source={require("./video/video.mp4")}   // Can be a URL or a local file.
              ref={(ref) => {
                this.player = ref
              }}
              repeat={true}
              style={styles.backgroundVideo}
            >

            </Video>
        }
        <View style={styles.buttonView}>
          {/* VideoCall */}
          <TouchableOpacity style={{ width: 35, height: 35 }}
            onPress={() => {
              this.setState({
                showScreenMode: 0,
                publisherProperties: {
                  ...this.state.publisherProperties,
                  videoSource: 'camera'
                }
              })
            }}

          >
            <Image style={{ width: '100%', height: '100%' }}
              resizeMode={'contain'}
              source={require("./image/video.png")}
            >
            </Image>
          </TouchableOpacity>
          {/* Share Screen */}
          <TouchableOpacity style={{ width: 35, height: 35 }}
            onPress={() => {
              this.setState({
                showScreenMode: 1,
                publisherProperties: {
                  ...this.state.publisherProperties,
                  videoSource: 'screen'
                }
              }, () => {
                console.log("this.Publist", this.state.publisherProperties,
                  "showScreenMode", this.state.showScreenMode)
              })
            }}
          >
            <Image style={{ width: '100%', height: '100%' }}
              resizeMode={'contain'}
              source={require("./image/screen.png")}
            >
            </Image>
          </TouchableOpacity>
          {/* Feature */}
          <TouchableOpacity
            onPress={this.onPressFeature}
            style={{ width: 35, height: 35 }}>
            <Image style={{ width: '100%', height: '100%' }}
              resizeMode={'contain'}
              source={require("./image/setting.png")}
            >
            </Image>
          </TouchableOpacity>
        </View>
        {/* Feature button */}
        {this.state.showFeatures && <View style={styles.featuresButton}>
          {/* Text */}
          <TouchableOpacity style={{
            width: 50, height: 50, marginBottom: 10,
            borderRadius: 50 / 2, backgroundColor: 'blue',
            justifyContent: 'center'
          }}
            onPress={() => {
              this.onChooseTool(0)
            }}
          >
            <Image style={{ width: 30, height: 30, alignSelf: 'center' }}
              resizeMode={'contain'}
              source={require("./image/font.png")}
            >
            </Image>
          </TouchableOpacity>
          {/* Line */}
          <TouchableOpacity style={{
            width: 50, height: 50, marginBottom: 10,
            borderRadius: 50 / 2, backgroundColor: 'red',
            justifyContent: 'center'
          }}
            onPress={() => {
              this.onChooseTool(1)
            }}
          >
            <Image style={{ width: 30, height: 30, alignSelf: 'center' }}
              resizeMode={'contain'}
              source={require("./image/brush-stroke.png")}
            >
            </Image>
          </TouchableOpacity>
          {/* Video */}
          <TouchableOpacity style={{
            width: 50, height: 50, marginBottom: 10,
            borderRadius: 50 / 2, backgroundColor: 'green',
            justifyContent: 'center'
          }}
            onPress={() => {
              this.onChooseTool(2)
            }}
          >
            <Image style={{ width: 30, height: 30, alignSelf: 'center' }}
              resizeMode={'contain'}
              source={require("./image/film.png")}
            >
            </Image>
          </TouchableOpacity>
        </View>
        }
      </SafeAreaView>
    );
  };

  joinVideoCall = () => {
    return (
      <SafeAreaView style={styles.fullView}>
        <Button
          onPress={this.joinCall}
          title="JoinCall"
          color="#841584"
          accessibilityLabel="Join call">
          Join Call
        </Button>
      </SafeAreaView>
    );
  };

  render() {
    return this.state.joinCall ? this.videoView() : this.joinVideoCall();
  }
}

// todo remember to twick the styles to not copy agora

const styles = StyleSheet.create({
  buttonView: {
    marginHorizontal: 30,
    borderRadius: 5,
    backgroundColor: '#131415', //'#131415' Vonage Black
    position: 'absolute',
    height: 80,
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  iconStyle: {
    fontSize: 34,
    paddingTop: 15,
    paddingLeft: 40,
    paddingRight: 40,
    paddingBottom: 15,
    /* borderRadius: 50 */
  },
  fullView: {
    flex: 1,
    backgroundColor: 'white'
  },
  scrollView: {
    // backgroundColor: Colors.lighter,
  },
  footer: {
    // color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
  publisherStyle: {
    width: 100,
    height: 100,
    position: 'absolute',
    top: 5,
    right: 5,
    zIndex: 5,
  },
  mainSubscriberStyle: {
    height: (dimensions.height * 3) / 4 - 50,
  },
  secondarySubscribers: {
    height: dimensions.height / 4,
  },
  featuresButton: {
    marginHorizontal: 30,
    position: 'absolute',
    bottom: 110,
    right: 0,
    flex: 1,
    width: 100,
    alignItems: 'center'
  },
  strokeColorButton: {
    marginHorizontal: 2.5, marginVertical: 8, width: 30, height: 30, borderRadius: 15,
  },
  strokeWidthButton: {
    marginHorizontal: 2.5, marginVertical: 8, width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#39579A'
  },
  functionButton: {
    marginHorizontal: 2.5, marginVertical: 8, height: 30, width: 60,
    backgroundColor: '#39579A', justifyContent: 'center', alignItems: 'center', borderRadius: 5,
  },
  backgroundVideo: {
    position: 'absolute',
    top: Dimensions.get("screen").height / 2 - 150,
    left: 0,
    bottom: 0,
    right: 0,
    justifyContent: 'center',
    height: 300,
    marginHorizontal: 20,
  },
});

export default App;