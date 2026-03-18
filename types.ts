// prettier-ignore
export namespace DouyinMedia {
  export type MediaRoot = {
      rawAdData?:               null;
      packAdDate:               null;
      isAds?:                   boolean;
      logPb?:                   string;
      awemeId:                  string;
      awemeType:                number;
      groupId:                  string;
      cooperationInfo:          CooperationInfo;
      chapterInfo:              ChapterInfo;
      authorInfo:               AuthorInfo;
      awemeControl:             AwemeControl;
      danmakuControl:           DanmakuControl;
      desc:                     string;
      authorUserId:             number | string;
      authenticationToken?:     string;
      mediaType?:               number;
      createTime:               number;
      textExtra:                TextExtra[];
      userDigged:               boolean;
      userCollected:            boolean;
      video:                    DouyinPlayerVideo;
      mixInfo:                  MixInfo;
      seriesInfo:               SeriesInfo;
      isPrivate:                boolean;
      isFriendLimit:            boolean;
      download:                 Download;
      impressionData:           string;
      fakeHorizontalInfo:       CooperationInfo;
      feedFlowControllerInfo:   CooperationInfo;
      tag:                      Tag;
      stroyInfo:                StroyInfo;
      stats:                    Stats;
      shareInfo:                ShareInfo;
      status:                   Status;
      webRawData:               WebRawData;
      wallpaperTagInfo:         null;
      music:                    Music;
      images:                   Image[];
      imageInfos:               string;
      imageAlbumMusicInfo:      ImageAlbumMusicInfo;
      imgBitrate:               any[];
      suggestWords:             SuggestWord[];
      seoInfo:                  SEOInfo;
      requestTime:              number;
      lvideoBrief:              CooperationInfo;
      relatedVideo:             RelatedVideo;
      varietyVideo:             CooperationInfo;
      fetchExpired:             number;
      dyQ:                      number | string;
      videoTag?:                VideoTag[];
      poiInfo:                  CooperationInfo;
      riskInfos?:               RiskInfos;
      entertainmentProductInfo: EntertainmentProductInfo;
      hotList?:                 DouyinPlayerHotList;
      isSlides?:                boolean;
      libfinsertTaskId?:        string;
      playProgress?:            PlayProgress;
      rate?:                    number;
      searchLogParams?:         SearchLogParams;
      docId?:                   string;
  }

  export type AuthorInfo = {
      uid:                    string;
      isAdFake?:              boolean;
      secUid:                 string;
      nickname:               string;
      remarkName?:            string;
      avatarUri:              string;
      followStatus:           number;
      followerStatus:         number;
      enterpriseVerifyReason: string;
      customVerify:           string;
      roomData:               CooperationInfo;
      avatarThumb:            AvatarThumb;
      roleTitle:              string;
      secret:                 number;
      roomId?:                number;
      accountCertInfo:        CooperationInfo;
      followerCount?:         number;
      totalFavorited?:        number;
      roomIdStr?:             string;
      url?:                   string;
  }

  export type CooperationInfo = {
  }

  export type AvatarThumb = {
      height:  number;
      width:   number;
      uri:     string;
      urlList: string[];
      urlKey?: string;
  }

  export type AwemeControl = {
      canComment?:     boolean;
      canForward?:     boolean;
      canShare?:       boolean;
      canShowComment?: boolean;
  }

  export type ChapterInfo = {
      status: boolean;
      list:   null;
  }

  export type DanmakuControl = {
      enableDanmaku?:      boolean;
      isPostDenied?:       boolean;
      postDeniedReason?:   string;
      postPrivilegeLevel?: number;
  }

  export type Download = {
      prevent?:      boolean;
      allowDownload: boolean;
  }

  export type EntertainmentProductInfo = {
      biz?:        number;
      market_info: MarketInfo;
      sub_title?:  null;
  }

  export type MarketInfo = {
      limit_free:     LimitFree;
      marketing_tag?: null;
  }

  export type LimitFree = {
      in_free: boolean;
  }

  export type DouyinPlayerHotList = {
      hotTitle:    string;
      extra:       string;
      footer:      string;
      header:      string;
      i18nTitle:   string;
      imageUrl:    string;
      patternType: number;
      schema:      string;
      sentence:    string;
      sentenceId:  number;
      title:       string;
      type:        number;
      hotScore:    number;
      groupId:     string;
      rank:        number;
      viewCount:   number;
  }

  export type ImageAlbumMusicInfo = {
      beginTime?: number;
      endTime?:   number;
      volume?:    number;
  }

  export type Image = {
      width:           number;
      height:          number;
      uri:             string;
      urlList:         string[];
      downloadUrlList: string[];
      video:           ImageVideo | null;
  }

  export type ImageVideo = {
      width:              number;
      height:             number;
      ratio:              string;
      duration:           number;
      dataSize:           number;
      uri:                string;
      playAddr:           PlayAddr[];
      playAddrSize:       number;
      playAddrFileHash:   string;
      playApi:            string;
      playAddrH265:       any[];
      playApiH265:        string;
      bitRateList:        PurpleBitRateList[];
      bitRateAudioList:   any[];
      cover:              string;
      coverUrlList:       string[];
      coverUri:           string;
      originCover:        string;
      rawCover:           string;
      originCoverUrlList: any[];
      meta:               PurpleMeta;
      bigThumbs:          any[];
      videoModel:         null;
  }

  export type PurpleBitRateList = {
      uri:             string;
      dataSize:        number;
      width:           number;
      height:          number;
      playAddr:        PlayAddr[];
      playApi:         string;
      isH265:          number;
      qualityType:     number;
      bitRate:         number;
      videoFormat:     Format;
      gearName:        string;
      fps:             number;
      playerAccessKey: string;
      featureId:       string;
      format:          Format;
      fileId:          string;
      pktOffsetMap:    PktOffsetMap[];
      realBitrate:     number;
      mvmaf:           CooperationInfo;
      ufq:             CooperationInfo;
  }

  export type Format = "mp4";

  export type PktOffsetMap = {
      time:   number;
      offset: number;
  }

  export type PlayAddr = {
      src: string;
  }

  export type PurpleMeta = {
      enable_manual_ladder: string;
      format:               Format;
      gear_vqm:             string;
      hrids:                string;
      is_spatial_video:     string;
      isad:                 string;
      qprf:                 string;
      sdgs:                 string;
      sr_score:             string;
      strategy_tokens:      string;
      vqs_origin:           string;
  }

  export type MixInfo = {
      cover:             string;
      status:            number;
      hasUpdatedEpisode: number;
      isCollected:       number;
      author:            Author;
      chargeInfo:        CooperationInfo;
  }

  export type Author = {
      uid:         string;
      secret:      number;
      isBlockedV2: boolean;
      userNotSee:  number;
      nickname?:   string;
  }

  export type Music = {
      id:                number | string;
      idStr:             string;
      mid:               string;
      author:            string;
      title:             string;
      coverThumb:        AvatarThumb;
      coverMedium:       AvatarThumb;
      playUrl:           AvatarThumb;
      secUid:            string;
      shareInfo:         CooperationInfo;
      extra:             Extra;
      album:             string;
      avatarThumb:       AvatarThumb;
      ownerNickname:     string;
      collectStat:       number;
      bindedChallengeId: number;
      status:            number;
      canNotPlay:        boolean;
      musicName:         string;
      isOriginal:        boolean;
      duration:          number;
      userCount:         number;
  }

  export type Extra = {
      hasEdited: number;
  }

  export type PlayProgress = {
      last_modified_time: number;
      play_progress:      number;
  }

  export type RelatedVideo = {
      extra: CooperationInfo;
  }

  export type RiskInfos = {
      content:   string;
      risk_sink: boolean;
      type:      number;
      vote:      boolean;
      warn:      boolean;
  }

  export type SearchLogParams = {
      log_pb:           LogPb;
      search_type:      string;
      impr_id:          string;
      search_id:        string;
      search_keyword:   string;
      column_type:      string;
      search_result_id: string;
      enter_from:       string;
  }

  export type LogPb = {
      impr_id: string;
  }

  export type SEOInfo = {
      expFields:   CooperationInfo;
      ocrContent?: string;
  }

  export type SeriesInfo = {
      cover:             string;
      horizontalCover:   string;
      status:            number;
      hasUpdatedEpisode: number;
      isCollected:       number;
      author:            Author;
      isCharge:          boolean;
      isIaa:             boolean;
      stats:             CooperationInfo;
      chargeInfo:        CooperationInfo;
  }

  export type ShareInfo = {
      shareUrl:      string;
      shareLinkDesc: string;
  }

  export type Stats = {
      commentCount:   number;
      diggCount:      number;
      shareCount:     number;
      playCount:      number;
      collectCount:   number;
      downloadCount:  number;
      forwardCount:   number;
      liveWatchCount: number;
  }

  export type Status = {
      allowShare:    boolean;
      isReviewing:   boolean;
      isDelete:      boolean;
      isProhibited:  boolean;
      privateStatus: number;
      partSee:       number;
      videoMute:     VideoMute;
      reviewResult:  ReviewResult;
      reviewStatus?: number;
  }

  export type ReviewResult = {
      reviewStatus?: number;
  }

  export type VideoMute = {
      isMute:   boolean;
      muteDesc: string;
  }

  export type StroyInfo = {
      shareFrom:   string;
      isSharePost: boolean;
  }

  export type SuggestWord = {
      scene:    string;
      words:    Word[];
      hintText: string;
      iconUrl:  string;
  }

  export type Word = {
      word:   string;
      wordId: string;
      info:   string;
  }

  export type Tag = {
      isTop:          boolean;
      relationLabels: boolean;
      isStory:        boolean;
      inReviewing:    boolean;
      labelPartSee:   number;
      hotList?:       TagHotList;
      reviewStatus?:  number;
  }

  export type TagHotList = {
      extra:        string;
      footer:       string;
      group_id:     string;
      header:       string;
      hot_score:    number;
      i18n_title:   string;
      image_url:    string;
      pattern_type: number;
      rank:         number;
      schema:       string;
      sentence:     string;
      sentence_id:  number;
      title:        string;
      type:         number;
      view_count:   number;
  }

  export type TextExtra = {
      start:           number;
      end:             number;
      type:            number;
      hashtagId:       string;
      hashtagName:     string;
      secUid:          string;
      awemeId:         string;
      userId:          string;
      isCommerce:      boolean;
      searchHideWords: number;
      searchQueryId:   string;
      searchRank:      number;
      searchText:      string;
  }

  export type DouyinPlayerVideo = {
      width:                 number;
      height:                number;
      ratio:                 string;
      duration:              number;
      dataSize?:             number;
      uri:                   string;
      playAddr:              PlayAddr[];
      playAddrSize?:         number;
      playAddrFileHash?:     string;
      playApi:               string;
      playAddrH265:          PlayAddr[];
      playAddrH265Size?:     number;
      playAddrH265FileHash?: string;
      playApiH265:           string;
      bitRateList:           FluffyBitRateList[];
      bitRateAudioList:      any[];
      cover:                 string;
      coverUrlList:          string[];
      coverUri:              string;
      dynamicCover?:         string;
      originCover:           string;
      rawCover:              string;
      originCoverUrlList:    string[];
      gaussianCover?:        string;
      meta:                  FluffyMeta;
      bigThumbs:             any[] | null;
      videoModel:            null;
      url?:                  string;
  }

  export type FluffyBitRateList = {
      uri:             URI;
      dataSize:        number;
      width:           number;
      height:          number;
      playAddr:        PlayAddr[];
      playApi:         string;
      isH265:          number;
      qualityType:     number;
      bitRate:         number;
      videoFormat:     Format;
      gearName:        string;
      fps:             number;
      playerAccessKey: string;
      featureId:       string;
      format:          Format;
      fileId:          string;
      pktOffsetMap:    PktOffsetMap[];
      realBitrate:     number;
      mvmaf:           { [key: string]: number };
      ufq:             Ufq;
  }

  export type Ufq = {
      enh?:      number;
      playback?: Playback;
      src?:      number;
      trans?:    number;
      version?:  Version;
  }

  export type Playback = {
      ori:  number;
      srv1: number;
  }

  export type Version = "v1.2";

  export type URI = string;

  export type FluffyMeta = {
      bright_ratio_mean?:       string;
      brightness_mean?:         string;
      diff_overexposure_ratio?: string;
      enable_manual_ladder?:    string;
      format?:                  Format;
      gear_vqm?:                string;
      hrids?:                   string;
      is_spatial_video?:        string;
      isad?:                    string;
      loudness?:                string;
      overexposure_ratio_mean?: string;
      peak?:                    string;
      qprf?:                    string;
      r_1?:                     string;
      r_10?:                    string;
      r_11?:                    string;
      r_2?:                     string;
      r_3?:                     string;
      r_4?:                     string;
      r_6?:                     string;
      r_7?:                     string;
      r_8?:                     string;
      r_9?:                     string;
      sdgs?:                    string;
      sr_potential?:            string;
      sr_score?:                string;
      std_brightness?:          string;
      strategy_tokens?:         string;
      title_info?:              string;
      volume_info?:             string;
      vqs_origin?:              string;
  }

  export type VideoTag = {
      level:   number;
      tagId:   number;
      tagName: string;
  }

  export type WebRawData = {
      oftenWatchInfo: OftenWatchInfo;
      videoImageInfo: CooperationInfo;
      CTR:            Ctr;
      brandAd:        BrandAd;
      insertInfo:     InsertInfo | null;
      recomPhrase?:   string;
      cutTitle?:      string;
  }

  export type Ctr = {
      recommendScore: RecommendScore;
  }

  export type RecommendScore = {
      showMix:           number;
      showSeries:        number;
      showHot:           number;
      showRelateSearch:  number;
      showRelateVideo?:  number;
      showAuthorRelated: number;
      relateAiTag?:      string;
  }

  export type BrandAd = {
      biz_content?: CooperationInfo;
  }

  export type InsertInfo = {
      is_ad: boolean;
  }

  export type OftenWatchInfo = {
      yellowPoint?: boolean;
  }

}

// prettier-ignore
export namespace DouyinPlayer {
    export interface PlayerInstance {
        vtype:                       string;
        bizType:                     number;
        videoConfig:                 PlayerInstanceVideoConfig;
        video:                       PlayerInstanceVideo;
        videoEventMiddleware:        InnerContainer;
        config:                      PlayerConfigClass;
        userTimer:                   null;
        waitTimer:                   null;
        isReady:                     boolean;
        isPlaying:                   boolean;
        isError:                     boolean;
        isSeeking:                   boolean;
        isCanplay:                   boolean;
        rotateDeg:                   number;
        isActive:                    boolean;
        isBufferControlPaused:       boolean;
        isCssfullScreen:             boolean;
        fullscreen:                  boolean;
        curDefinition:               CurDefinition;
        videoPos:                    VideoPos;
        sizeInfo:                    SizeInfo;
        innerContainer:              InnerContainer;
        controls:                    Controls;
        topBar:                      InnerContainer;
        root:                        InnerContainer;
        database:                    Database;
        isUserActive:                boolean;
        innerStates:                 InnerStates;
        instManager:                 InnerContainer;
        leftBar:                     InnerContainer;
        rightBar:                    InnerContainer;
        vodLogger:                   VODLogger;
        preloader:                   InnerContainer;
        mp4MseFlag:                  boolean;
        oldBit:                      number;
        canCheckNotUse:              boolean;
        replayed:                    boolean;
        equalizeVolumeState:         string;
        volumeBalanceState:          number;
        pauseType:                   string;
        isInstNext:                  boolean;
        isMultiple:                  number;
        curClarity:                  string;
        videoList:                   List[];
        isComplete:                  boolean;
        loadstart:                   number;
        loadeddata:                  number;
        bufferedBeforeActive:        number;
        loadstartBeforeActive:       number;
        loadeddataBeforeActive:      number;
        blockPlayType:               string;
        preplay:                     number;
        preplayStat:                 number;
        effectNodeConsumeTime:       EffectNodeConsumeTime;
        lufs:                        number;
        useMammonWorkletProcessorV3: boolean;
        hitMammonWorkletProcessorV3: boolean;
        errored:                     number;
        playTimestamp:               number;
        firstframe:                  number;
        stages:                      Stages;
        firstFrameTmp:               number;
        upperCount:                  number;
        lowerCount:                  number;
        abrCount:                    number;
        abrChangeCount:              number;
        upperAbrChangeCount:         number;
        lowerAbrChangeCount:         number;
        playTime:                    number;
        removedBuffer:               number;
        isEnded:                     boolean;
        danmakuShowCount:            number;
        danmaku:                     Danmaku;
        danmakuIds:                  string[];
        videoTimes:                  number[];
        realTimeSpeedPCDN:           number;
        avgSpeedPCDN:                number;
    }
    
    export interface PlayerConfigClass {
        id:                           string;
        el:                           InnerContainer;
        url:                          DowngradeURL[];
        domEventType:                 string;
        nullUrlStart:                 boolean;
        width:                        string;
        height:                       string;
        fluid:                        boolean;
        fitVideoSize:                 string;
        videoFillMode:                string;
        volume:                       Volume;
        autoplay:                     boolean;
        autoplayMuted:                boolean;
        loop:                         boolean;
        isLive:                       boolean;
        zoom:                         number;
        videoInit:                    boolean;
        poster:                       string;
        isMobileSimulateMode:         boolean;
        defaultPlaybackRate:          number;
        execBeforePluginsCall:        null;
        allowSeekAfterEnded:          boolean;
        enableContextmenu:            boolean;
        closeVideoClick:              boolean;
        closeVideoDblclick:           boolean;
        closePlayerBlur:              boolean;
        closeDelayBlur:               boolean;
        leavePlayerTime:              number;
        closePlayVideoFocus:          boolean;
        closePauseVideoFocus:         boolean;
        closeFocusVideoFocus:         boolean;
        closeControlsBlur:            boolean;
        topBarAutoHide:               boolean;
        videoAttributes:              InnerContainer;
        startTime:                    number;
        seekedStatus:                 string;
        miniprogress:                 boolean;
        ignores:                      string[];
        whitelist:                    any[];
        inactive:                     number;
        lang:                         string;
        controls:                     Con;
        marginControls:               boolean;
        fullscreenTarget:             InnerContainer;
        screenShot:                   boolean;
        rotate:                       boolean;
        pip:                          Pip;
        download:                     boolean;
        mini:                         boolean;
        cssFullscreen:                boolean;
        keyShortcut:                  boolean;
        presets:                      null[];
        plugins:                      null[];
        playbackRate:                 boolean;
        definition:                   Definition;
        playsinline:                  boolean;
        customDuration:               number;
        timeOffset:                   number;
        icons:                        Icons;
        i18n:                         I18N[];
        tabindex:                     number;
        thumbnail:                    Thumbnail;
        videoConfig:                  ConfigVideoConfig;
        isHideTips:                   boolean;
        minWaitDelay:                 number;
        commonStyle:                  CommonStyle;
        reuse:                        number;
        closeVideoPreventDefault:     boolean;
        closeVideoStopPropagation:    boolean;
        awemeType:                    number;
        dynamicBg:                    DynamicBg;
        enter:                        Enter;
        start:                        Start;
        progresspreview:              Progresspreview;
        progress:                     boolean;
        miniscreen:                   SizeInfo;
        vodLogOpts:                   VODLogOpts;
        BitrateSelector:              BitrateSelector;
        keyboard:                     Keyboard;
        vtype:                        string;
        TestSpeed:                    TestSpeed;
        mobile:                       Mobile;
        fixOOM:                       boolean;
        unregisterPluginFromControls: boolean;
        fpsdetect:                    Fpsdetect;
        awemeInfo:                    AwemeInfo;
        size:                         number;
        uri:                          URI;
        vid:                          string;
        authorId:                     string;
        videoWidth:                   number;
        videHeight:                   number;
        defaultDefinition:            number;
        defaultBitrate:               number;
        duration:                     number;
        bizType:                      number;
        bitrate:                      number;
        codecType:                    string;
        mediaType:                    string;
        focusUserDefinition:          boolean;
        DASHPlugin:                   DASHPlugin;
        downgradeUrl:                 DowngradeURL[];
        videoUrl:                     DowngradeURL[];
        recordList:                   any[];
        mp4encryptplayer:             Mp4Encryptplayer;
        enableSr:                     boolean;
        time:                         Time;
        clearLists:                   ClearList[];
        notUseRefreshVid:             null;
    }
    
    export interface BitrateSelector {
        paramBf:                      number;
        paramBp:                      number;
        paramUpper:                   number;
        paramLower:                   number;
        paramUpperBl:                 number;
        paramVl1:                     number;
        paramVl2:                     number;
        paramVlUpper:                 number;
        paramVlLower:                 number;
        bitrateUpper:                 number;
        bitrateLower:                 number;
        slidingWindowType:            string;
        slidingWindowWeight:          string;
        slidingWindowWeightThreshold: number;
        slidingWindowCountThreshold:  number;
        slidingWindowExtraction:      string;
        bitrateRange:                 number[];
        mode:                         string;
        quality_filter:               QualityFilter;
        autoBitrateParams:            AutoBitrateParams;
        mixFactor:                    number;
        white_list:                   string[];
        bitrateKey:                   string;
        overscore:                    Overscore;
    }
    
    export interface AutoBitrateParams {
        paramA: number;
        paramB: number;
        paramC: number;
        paramD: number;
    }
    
    export interface Overscore {
        isOpen:     boolean;
        type:       string;
        filterKey:  string;
        filterList: FilterList[];
        enable266:  boolean;
    }
    
    export interface FilterList {
        source: number;
        target: number[];
    }
    
    export interface QualityFilter {
        adapt_lowest_1080_1: AdaptLowest1080_1;
        adapt_lowest_720_1:  AdaptLowest1080_1;
        normal_1080_0:       AdaptLowest1080_1;
    }
    
    export interface AdaptLowest1080_1 {
        lower: number;
        upper: number;
    }
    
    export interface DASHPlugin {
        minBufferLength:              number;
        maxBufferLength:              number;
        defaultFormat:                string;
        dashOpts:                     InnerContainer;
        smallGapLimit:                number;
        playInfoType:                 string;
        disableBufferBreakCheck:      boolean;
        waitingTimeOut:               number;
        tickInSeconds:                number;
        needAutoBitrate:              boolean;
        disableCanplayCheck:          boolean;
        loadFirstGopData:             boolean;
        useGopCacheAcc:               boolean;
        autoBitrateOpts:              AutoBitrateOpts;
        pcdnConfig:                   PcdnConfig;
        open:                         boolean;
        openAdaptRange:               boolean;
        timeout:                      number;
        removeBufferLen:              number;
        removeBufferWhenSeekInBuffer: boolean;
        replayReset:                  boolean;
        waitingInBufferTimeOut:       number;
        useProgressiveAppend:         boolean;
        useProgressiveAppendAll:      boolean;
        videoDuration:                number;
        usePCDNProgressiveCheck:      boolean;
        resetStateUpdrade:            boolean;
        useSeparationMode:            boolean;
        useCDNProgressiveCheck:       boolean;
        loader:                       Loader;
        dashPcdnConfig:               DashPcdnConfig;
        dashAdaptRangeConfig:         null;
        canplayTimeout:               number;
        downgrade:                    number;
        fixPreplay:                   number;
        usePlayAbortRetry:            boolean;
        useStuckCheck:                boolean;
        useStuckWaitBuffer:           boolean;
        usePCDNOpt:                   boolean;
        adaptRange:                   AdaptRange;
        notDegradeErrorList:          number[];
        segmentMinDuration:           number;
    }
    
    export interface AdaptRange {
        cacheSafeFactor:    number;
        estPTcontrol:       boolean;
        estPlayTime:        number;
        maxTargetCacheDur:  number;
        minBandwidth:       number;
        minDangerThreshold: number;
        minTargetCacheDur:  number;
        rangeControl:       boolean;
        rangeMaxDuration:   number;
        rangeMinDuration:   number;
        rangeMinSize:       number;
        safeFactor:         number;
        targetCacheControl: boolean;
    }
    
    export interface AutoBitrateOpts {
        isPlayAutoDefi: boolean;
        isOpenAutoDefi: boolean;
        isClassic:      boolean;
        abrDriveMode:   number;
        algoArg:        AlgoArg;
    }
    
    export interface AlgoArg {
        bbaControl: boolean;
        highLevel:  number;
        lowLevel:   number;
    }
    
    export interface InnerContainer {
    }
    
    export interface DashPcdnConfig {
        openPCDN:        boolean;
        adaptPCDNConfig: DashPcdnConfigAdaptPCDNConfig;
    }
    
    export interface DashPcdnConfigAdaptPCDNConfig {
        PCDNBufferControl: boolean;
    }
    
    export interface Loader {
        loaderCount:         number;
        onProcessMinLen:     number;
        enableDynamicMinLen: boolean;
    }
    
    export interface PcdnConfig {
        openPCDN:        boolean;
        enterMinBuffer:  number;
        outMaxBuffer:    number;
        minDuration:     number;
        openPreloadPCDN: boolean;
        withReferer:     number;
        adaptPCDNConfig: PcdnConfigAdaptPCDNConfig;
        trackerUrl:      string;
        app_id:          number;
        sid:             number;
    }
    
    export interface PcdnConfigAdaptPCDNConfig {
        PCDNBufferControl: boolean;
        PCDNCntControl:    boolean;
        alpha:             number;
        estPTcontrol:      boolean;
        estPlayTime:       number;
        maxPCDNInBuffer:   number;
        maxPCDNOutBuffer:  number;
        minBandwidth:      number;
        minPCDNInBuffer:   number;
        minPCDNOutBuffer:  number;
        safePCDNInFactor:  number;
        safePCDNOutFactor: number;
    }
    
    export interface TestSpeed {
        url:              string;
        openSpeed:        boolean;
        testCnt:          number;
        addSpeedTypeList: string[];
        loadSize:         number;
        testTimeStep:     number;
    }
    
    export interface AwemeInfo {
        rawAdData:                   null;
        packAdDate:                  null;
        isAds:                       boolean;
        logPb:                       string;
        awemeId:                     string;
        awemeType:                   number;
        userRecommendStatus:         number;
        groupId:                     string;
        cooperationInfo:             InnerContainer;
        chapterInfo:                 ChapterInfo;
        authorInfo:                  AuthorInfo;
        awemeControl:                AwemeControl;
        danmakuControl:              DanmakuControl;
        douyinPcVideoExtra:          InnerContainer;
        pcBlockedAreaRatio:          number[];
        desc:                        string;
        authorUserId:                number;
        authenticationToken:         string;
        mediaType:                   number;
        createTime:                  number;
        textExtra:                   TextExtra[];
        relatedVideoExtra:           RelatedVideoExtra;
        userDigged:                  boolean;
        userCollected:               boolean;
        video:                       AwemeInfoVideo;
        mixInfo:                     MixInfo;
        seriesInfo:                  SeriesInfo;
        isPrivate:                   boolean;
        isFriendLimit:               boolean;
        download:                    Download;
        friendRecommendInfo:         FriendRecommendInfo;
        impressionData:              string;
        fakeHorizontalInfo:          InnerContainer;
        feedFlowControllerInfo:      InnerContainer;
        tag:                         Tag;
        stroyInfo:                   StroyInfo;
        stats:                       Stats;
        shareInfo:                   ShareInfo;
        status:                      StatusClass;
        webRawData:                  WebRawData;
        wallpaperTagInfo:            null;
        music:                       Music;
        images:                      any[];
        imageInfos:                  string;
        imageAlbumMusicInfo:         InnerContainer;
        imgBitrate:                  any[];
        suggestWords:                SuggestWord[];
        seoInfo:                     SEOInfo;
        requestTime:                 number;
        lvideoBrief:                 InnerContainer;
        relatedVideo:                RelatedVideo;
        varietyVideo:                InnerContainer;
        fetchExpired:                number;
        dyQ:                         string;
        videoTag:                    VideoTag[];
        poiInfo:                     InnerContainer;
        riskInfos:                   RiskInfos;
        entertainmentProductInfo:    EntertainmentProductInfo;
        weeklyRecommend:             null;
        douyinPCHighlight:           null;
        selectAnchorExpandedContent: number;
        douyinPCVideoExtraSEO:       InnerContainer;
    }
    
    export interface AuthorInfo {
        uid:                    string;
        isAdFake:               boolean;
        secUid:                 string;
        nickname:               string;
        remarkName:             string;
        avatarUri:              string;
        followStatus:           number;
        followerStatus:         number;
        enterpriseVerifyReason: string;
        customVerify:           string;
        roomData:               InnerContainer;
        avatarThumb:            AvatarThumb;
        roleTitle:              string;
        secret:                 number;
        roomId:                 number;
        accountCertInfo:        InnerContainer;
    }
    
    export interface AvatarThumb {
        height:  number;
        width:   number;
        uri:     string;
        urlList: string[];
        urlKey?: string;
    }
    
    export interface AwemeControl {
        canComment:     boolean;
        canForward:     boolean;
        canShare:       boolean;
        canShowComment: boolean;
    }
    
    export interface ChapterInfo {
        status:              boolean;
        list:                any[];
        isPoint:             boolean;
        useRecommendChapter: boolean;
        showAiTag:           boolean;
    }
    
    export interface DanmakuControl {
        enableDanmaku:      boolean;
        isPostDenied:       boolean;
        postDeniedReason:   string;
        postPrivilegeLevel: number;
    }
    
    export interface Download {
        prevent:       boolean;
        urlList:       string[];
        allowDownload: boolean;
        dataSize:      number;
    }
    
    export interface EntertainmentProductInfo {
        biz:         number;
        market_info: MarketInfo;
        sub_title:   null;
    }
    
    export interface MarketInfo {
        limit_free:    LimitFree;
        marketing_tag: null;
    }
    
    export interface LimitFree {
        in_free: boolean;
    }
    
    export interface FriendRecommendInfo {
        friend_recommend_source: number;
        label_user_list:         null;
        recommend_predict_rate:  RecommendPredictRate;
        recommend_predict_score: RecommendPredictRate;
    }
    
    export interface RecommendPredictRate {
        s: number;
        e: number;
        c: number[];
    }
    
    export interface MixInfo {
        cover:             string;
        coverUri:          string;
        status:            number;
        hasUpdatedEpisode: number;
        isCollected:       number;
        author:            Author;
        isSeries2Mix:      boolean;
        chargeInfo:        InnerContainer;
    }
    
    export interface Author {
        uid:         string;
        secret:      number;
        isBlockedV2: boolean;
        userNotSee:  number;
        nickname?:   string;
    }
    
    export interface Music {
        id:                RecommendPredictRate;
        idStr:             string;
        mid:               string;
        author:            string;
        title:             string;
        coverThumb:        AvatarThumb;
        coverMedium:       AvatarThumb;
        playUrl:           AvatarThumb;
        secUid:            string;
        shareInfo:         InnerContainer;
        extra:             Extra;
        album:             string;
        avatarThumb:       AvatarThumb;
        ownerNickname:     string;
        collectStat:       number;
        bindedChallengeId: number;
        status:            number;
        canNotPlay:        boolean;
        musicName:         string;
        isOriginal:        boolean;
        duration:          number;
        userCount:         number;
    }
    
    export interface Extra {
        hasEdited: number;
    }
    
    export interface RelatedVideo {
        extra: InnerContainer;
    }
    
    export interface RelatedVideoExtra {
        tags: Tags;
    }
    
    export interface Tags {
        level1: Level;
        level2: Level;
        level3: Level;
    }
    
    export interface Level {
        tag_id:   number;
        prob:     number;
        tag_name: string;
    }
    
    export interface RiskInfos {
        content:   string;
        risk_sink: boolean;
        type:      number;
        vote:      boolean;
        warn:      boolean;
    }
    
    export interface SEOInfo {
        ocrContent: string;
        expFields:  InnerContainer;
    }
    
    export interface SeriesInfo {
        isSeries2Mix:      boolean;
        cover:             string;
        horizontalCover:   string;
        status:            number;
        hasUpdatedEpisode: number;
        isCollected:       number;
        author:            Author;
        isCharge:          boolean;
        isIaa:             boolean;
        stats:             InnerContainer;
        chargeInfo:        InnerContainer;
    }
    
    export interface ShareInfo {
        shareUrl:      string;
        shareLinkDesc: string;
    }
    
    export interface Stats {
        commentCount:   number;
        diggCount:      number;
        shareCount:     number;
        playCount:      number;
        collectCount:   number;
        downloadCount:  number;
        forwardCount:   number;
        liveWatchCount: number;
        recommendCount: number;
    }
    
    export interface StatusClass {
        allowShare:                 boolean;
        isReviewing:                boolean;
        isDelete:                   boolean;
        isProhibited:               boolean;
        privateStatus:              number;
        partSee:                    number;
        videoMute:                  VideoMute;
        reviewResult:               InnerContainer;
        allowFriendRecommendGuide:  boolean;
        allowSelfRecommendToFriend: boolean;
    }
    
    export interface VideoMute {
        isMute:   boolean;
        muteDesc: string;
    }
    
    export interface StroyInfo {
        shareFrom:   string;
        isSharePost: boolean;
    }
    
    export interface SuggestWord {
        scene:    string;
        words:    Word[];
        hintText: string;
        iconUrl:  string;
    }
    
    export interface Word {
        word:   string;
        wordId: string;
        info:   string;
    }
    
    export interface Tag {
        isTop:          boolean;
        relationLabels: boolean;
        isStory:        boolean;
        inReviewing:    boolean;
        labelPartSee:   number;
    }
    
    export interface TextExtra {
        start:           number;
        end:             number;
        type:            number;
        hashtagId:       string;
        hashtagName:     string;
        secUid:          string;
        awemeId:         string;
        userId:          UserID;
        isCommerce:      boolean;
        searchHideWords: number;
        searchQueryId:   string;
        searchRank:      number;
        searchText:      string;
    }
    
    export enum UserID {
        Empty = "",
        The3483731444642003 = "3483731444642003",
    }
    
    export interface AwemeInfoVideo {
        width:                number;
        height:               number;
        ratio:                string;
        duration:             number;
        dataSize:             number;
        uri:                  URI;
        playAddr:             DowngradeURL[];
        playAddrSize:         number;
        playAddrFileHash:     string;
        playApi:              string;
        playAddrH265:         DowngradeURL[];
        playAddrH265Size:     number;
        playAddrH265FileHash: string;
        playApiH265:          string;
        bitRateList:          List[];
        bitRateAudioList:     any[];
        cover:                string;
        coverUrlList:         string[];
        coverUri:             string;
        dynamicCover:         string;
        originCover:          string;
        rawCover:             string;
        originCoverUrlList:   string[];
        gaussianCover:        string;
        meta:                 Meta;
        bigThumbs:            BigThumb[];
        videoModel:           null;
    }
    
    export interface BigThumb {
        duration:   number;
        fext:       string;
        img_num:    number;
        img_url:    string;
        img_urls:   string[];
        img_x_len:  number;
        img_x_size: number;
        img_y_len:  number;
        img_y_size: number;
        interval:   number;
        uri:        string;
        uris:       string[];
    }
    
    export interface List {
        uri:                  URI;
        dataSize:             number;
        width:                number;
        height:               number;
        playAddr:             DowngradeURL[];
        playApi:              string;
        isH265:               number;
        qualityType:          number;
        bitRate:              number;
        videoFormat:          Format;
        gearName:             string;
        fps:                  number;
        playerAccessKey:      string;
        HDRBit:               string;
        HDRType:              string;
        featureId:            string;
        format:               Format;
        fileId:               string;
        pktOffsetMap:         PktOffsetMap[];
        realBitrate:          number;
        mvmaf:                { [key: string]: number };
        ufq:                  Ufq;
        srSharpnessStrength?: number;
    }
    
    export enum Format {
        Mp4 = "mp4",
    }
    
    export interface PktOffsetMap {
        time:   number;
        offset: number;
    }
    
    export interface DowngradeURL {
        src: string;
    }
    
    export interface Ufq {
        enh?:      number;
        playback?: Playback;
        src?:      number;
        trans?:    number;
        version?:  Version;
    }
    
    export interface Playback {
        ori:  number;
        srv1: number;
    }
    
    export enum Version {
        V10 = "v1.0",
    }
    
    export enum URI {
        V0D00Fg10000D3C7Glvog65Ud4Dg3Eqg = "v0d00fg10000d3c7glvog65ud4dg3eqg",
    }
    
    export interface Meta {
        bright_ratio_mean:       string;
        brightness_mean:         string;
        diff_overexposure_ratio: string;
        enable_manual_ladder:    string;
        format:                  Format;
        gear_vqm:                string;
        hrids:                   string;
        is_spatial_video:        string;
        isad:                    string;
        loudness:                string;
        overexposure_ratio_mean: string;
        peak:                    string;
        qprf:                    string;
        r_1:                     string;
        r_10:                    string;
        r_11:                    string;
        r_2:                     string;
        r_3:                     string;
        r_4:                     string;
        r_6:                     string;
        r_7:                     string;
        r_8:                     string;
        r_9:                     string;
        sdgs:                    string;
        sr_potential:            string;
        sr_score:                string;
        std_brightness:          string;
        strategy_tokens:         string;
        title_info:              string;
        volume_info:             string;
        vqs_origin:              string;
    }
    
    export interface VideoTag {
        level:   number;
        tagId:   number;
        tagName: string;
    }
    
    export interface WebRawData {
        oftenWatchInfo: OftenWatchInfo;
        videoImageInfo: InnerContainer;
        CTR:            Ctr;
        brandAd:        BrandAd;
        insertInfo:     InsertInfo;
        quality:        number;
    }
    
    export interface Ctr {
        recommendScore: RecommendScore;
    }
    
    export interface RecommendScore {
        showMix:          number;
        showHot:          number;
        showSeries:       number;
        showRelateSearch: number;
        showAiSearch:     number;
        showRelateVideo:  number;
        relateAiTag:      string;
    }
    
    export interface BrandAd {
        biz_content: InnerContainer;
    }
    
    export interface InsertInfo {
        is_ad: boolean;
    }
    
    export interface OftenWatchInfo {
        yellowPoint: boolean;
    }
    
    export interface ClearList {
        key:             string;
        label:           string;
        val:             ValClass | string;
        stat:            string;
        quality:         number;
        defaultQuality?: number;
        gearName:        string;
        gearType:        number;
    }
    
    export interface ValClass {
        type:  string;
        key:   null;
        ref:   null;
        props: ValProps;
    }
    
    export interface ValProps {
        className: string;
        children:  Array<Child | null>;
    }
    
    export interface Child {
        type:  string;
        key:   null;
        ref:   null;
        props: ChildProps;
    }
    
    export interface ChildProps {
        children: string;
    }
    
    export interface CommonStyle {
        progressColor:  string;
        playedColor:    string;
        cachedColor:    string;
        sliderBtnStyle: InnerContainer;
        volumeColor:    string;
    }
    
    export interface Con {
        mode:     string;
        autoHide: boolean;
        initShow: boolean;
        disable?: boolean;
    }
    
    export interface Definition {
        list: CurDefinition[];
    }
    
    export interface CurDefinition {
        vid:                     string;
        size:                    number;
        uri:                     URI;
        url:                     DowngradeURL[];
        bitrate:                 number;
        definition:              number;
        qualityType:             number;
        duration:                number;
        isH265:                  number;
        gearName:                string;
        pktOffsetMap:            PktOffsetMap[];
        featureId:               string;
        isH266:                  number;
        isHDR:                   number;
        vtype:                   string;
        mediaType:               string;
        codecType:               string;
        fps:                     number;
        file_id:                 string;
        realBitrate:             number;
        width:                   number;
        height:                  number;
        mvmaf:                   { [key: string]: number };
        ufq:                     Ufq;
        format:                  Format;
        srSharpnessStrength?:    number;
        filterRateCnt?:          number;
        isFilterMaxRate?:        number;
        bitrateSetSelector?:     string[];
        qualityBitrateSelector?: string[];
        type?:                   string;
        speed?:                  number;
        chosenType?:             number;
        chosenReason?:           string;
    }
    
    export interface DynamicBg {
        disable:   boolean;
        frameRate: number;
        filter:    string;
        maskBg:    string;
    }
    
    export interface Enter {
        innerHtml: string;
    }
    
    export interface Fpsdetect {
        stuckCount: number;
    }
    
    export interface I18N {
        LANG: string;
        TEXT: Text;
    }
    
    export interface Text {
        MEDIA_ERR_SRC_NOT_SUPPORTED: string;
    }
    
    export interface Icons {
        play:           string;
        pause:          string;
        startPlay:      string;
        startPause:     string;
        playNext:       string;
        mini:           string;
        volumeSmall:    string;
        volumeLarge:    string;
        volumeMuted:    string;
        fullscreen:     string;
        exitFullscreen: string;
        loadingIcon:    string;
        pipIcon:        string;
        pipIconExit:    string;
    }
    
    export interface Keyboard {
        isGlobalTrigger:    boolean;
        disableRootTrigger: boolean;
        keyCodeMap:         KeyCodeMap;
        seekStep:           number;
    }
    
    export interface KeyCodeMap {
        up:   Down;
        down: Down;
    }
    
    export interface Down {
        disable: boolean;
    }
    
    export interface SizeInfo {
        width:        number;
        height:       number;
        left:         number;
        top:          number;
        disableDrag?: boolean;
    }
    
    export interface Mobile {
        gestureY: boolean;
    }
    
    export interface Mp4Encryptplayer {
        preloadTime:           number;
        isDegrade:             boolean;
        waitingTimeOut:        number;
        preloadCacheType:      number;
        needAutoBitrate:       boolean;
        startPreloadMinBuffer: number;
        maxBufferLength:       number;
        minBufferLength:       number;
        removeBufferLen:       number;
        preloadMaxCacheCount:  number;
        resumePlayWaterLevel:  number;
        onProcessMinLen:       number;
        needPreloadCheck:      boolean;
        forceVideoPlay:        boolean;
        segmentMinDuration:    number;
        tickInSeconds:         number;
        audioGroupingStrategy: number;
        switchBitRateWay:      boolean;
        loadFirstGopData:      boolean;
        noPreloadAddBufferLen: number;
        removeBufferAtSeek:    boolean;
        loadRangeType:         string;
        pcdnConfig:            PcdnConfig;
        adaptRange:            AdaptRange;
        notDegradeErrorList:   number[];
        enableMsePatches:      boolean;
    }
    
    export interface Pip {
        showIcon:                 boolean;
        preferDocument:           boolean;
        disallowReturnToOpener:   boolean;
        alwaysKeepDocumentWindow: boolean;
        width:                    number;
        height:                   number;
    }
    
    export interface Progresspreview {
        width:  number;
        height: number;
    }
    
    export interface Start {
        disableAnimate: boolean;
    }
    
    export interface Thumbnail {
        urls:    string[];
        pic_num: number;
        row:     number;
        col:     number;
        height:  number;
        width:   number;
    }
    
    export interface Time {
        smartRender: boolean;
    }
    
    export interface ConfigVideoConfig {
        crossorigin:             string;
        disablePictureInPicture: boolean;
    }
    
    export interface VODLogOpts {
        line_app_id:        number;
        line_user_id:       string;
        vtype:              string;
        tag:                string;
        codec_type:         string;
        drm_type:           number;
        disableLocalCache:  boolean;
        channel:            ChannelEnum;
        closeResolutionLog: boolean;
        closeSeekLog:       boolean;
        maxQueueCount:      number;
        isTask:             boolean;
        enableAbTest:       boolean;
        checkByInnerLog:    boolean;
    }
    
    export enum ChannelEnum {
        CN = "cn",
    }
    
    export interface Volume {
        default:        number;
        showValueLabel: boolean;
    }
    
    export interface Controls {
        config:       Con;
        playerConfig: PlayerConfigClass;
        pluginName:   string;
        icons:        InnerContainer;
        root:         InnerContainer;
        parent:       InnerContainer;
        langText:     InnerContainer;
        left:         InnerContainer;
        center:       InnerContainer;
        right:        InnerContainer;
        innerRoot:    InnerContainer;
    }
    
    export interface Danmaku {
        logger:          BulletBtnLogger;
        config:          DanmakuConfig;
        globalHooks:     InnerContainer;
        hideArr:         any[];
        recycler:        Recycler;
        freezeId:        null;
        container:       InnerContainer;
        live:            boolean;
        direction:       string;
        bulletBtn:       BulletBtn;
        main:            Main;
        isReady:         boolean;
        emojiListMapped: InnerContainer;
        mouseControl:    boolean;
    }
    
    export interface BulletBtn {
        logger: BulletBtnLogger;
        main:   Main;
    }
    
    export interface BulletBtnLogger {
        constructorName: ConstructorName;
    }
    
    export enum ConstructorName {
        Bullet = "bullet",
        ChannelJS = "channel.js",
        ControlJS = "control.js",
        DanmuJS = "danmu.js",
        MainJS = "main.js",
    }
    
    export interface Main {
        logger:      BulletBtnLogger;
        container:   InnerContainer;
        channel:     MainChannel;
        data:        Datum[];
        playedData:  any[];
        queue:       QueueElement[];
        timer:       null;
        playRate:    number;
        retryStatus: string;
        interval:    number;
        handleTimer: number;
    }
    
    export interface MainChannel {
        logger:          BulletBtnLogger;
        width:           number;
        height:          number;
        container:       InnerContainer;
        resetId:         null;
        channels:        ChannelElement[];
        containerPos:    InnerContainer;
        containerWidth:  number;
        containerHeight: number;
        containerTop:    number;
        containerBottom: number;
        containerLeft:   number;
        containerRight:  number;
        channelCount:    number;
        channelHeight:   number;
        resizing:        boolean;
        resizeId:        null;
    }
    
    export interface ChannelElement {
        id:        number;
        queue:     ChannelQueue;
        operating: Operating;
        bookId:    InnerContainer;
    }
    
    export interface Operating {
        scroll: boolean;
        top:    boolean;
        bottom: boolean;
    }
    
    export interface ChannelQueue {
        scroll: QueueElement[];
        top:    any[];
        bottom: any[];
    }
    
    export interface QueueElement {
        logger:             BulletBtnLogger;
        options:            Datum;
        duration:           number;
        id:                 string;
        container:          InnerContainer;
        mode:               Mode;
        start:              number;
        prior:              boolean;
        realTime:           boolean;
        reuseDOM:           boolean;
        noCopyEl:           boolean;
        recycler:           Recycler;
        status:             StatusEnum;
        random:             number;
        el:                 InnerContainer;
        elPos:              InnerContainer;
        width:              number;
        height:             number;
        channel_id:         number[];
        top:                number;
        hasMove:            boolean;
        moveMoreS:          number;
        moveContainerWidth: number;
    }
    
    export enum Mode {
        Scroll = "scroll",
    }
    
    export interface Datum {
        start:      number;
        realTime:   boolean;
        duration:   number;
        id:         string;
        user_id:    string;
        score:      number;
        elLazyInit: boolean;
        text:       string;
        style:      Style;
        prior:      boolean;
        attached_:  boolean;
    }
    
    export interface Style {
        fontSize:    FontSize;
        height:      FontSize;
        lineHeight:  FontSize;
        color:       Color;
        marginTop:   string;
        perspective: Perspective;
        left:        string;
    }
    
    export enum Color {
        Ffffff = "#FFFFFF",
    }
    
    export enum FontSize {
        The20Px = "20px",
    }
    
    export enum Perspective {
        The500Em = "500em",
    }
    
    export interface Recycler {
        idleList:  InnerContainer[];
        usingList: any[];
        options:   Options;
    }
    
    export interface Options {
        initSize: number;
    }
    
    export enum StatusEnum {
        Start = "start",
    }
    
    export interface DanmakuConfig {
        overlap:            boolean;
        area:               Area;
        hooks:              InnerContainer;
        live:               boolean;
        comments:           any[];
        direction:          string;
        needResizeObserver: boolean;
        dropStaleComments:  boolean;
        channelSize:        number;
        interval:           number;
        highScorePriority:  boolean;
        chaseEffect:        boolean;
        disableCopyDOM:     boolean;
        mouseControl:       boolean;
        mouseControlPause:  boolean;
        container:          InnerContainer;
        defaultOff:         boolean;
        bOffset:            number;
    }
    
    export interface Area {
        start: number;
        end:   number;
    }
    
    export interface Database {
        indexedDB: InnerContainer;
        myDB:      MyDB;
    }
    
    export interface MyDB {
        name:    string;
        version: number;
        db:      null;
        ojstore: Ojstore;
    }
    
    export interface Ojstore {
        name:    string;
        keypath: string;
    }
    
    export interface EffectNodeConsumeTime {
        longest:  number;
        shortest: number;
    }
    
    export interface InnerStates {
        isActiveLocked: boolean;
    }
    
    export interface Stages {
        playerinit_to_loadstart:        number;
        playerinit_to_loadeddata:       number;
        playerstart_to_mp4metaready:    number;
        mp4init_to_mp4metaready:        number;
        playerinitfinally_to_loadstart: number;
        mp4metaready_to_loadstart:      number;
        loadstart_to_mseopen:           number;
        mseinitsegok_to_appenddataok:   number;
        mseinitseg_to_mseinitsegok:     number;
        appenddataok_to_loadeddata:     number;
        mseopen_to_loadeddata:          number;
        mse_all_phrase:                 string;
        preload_error:                  number;
        is_slide_loadeddata:            number;
        slide_to_loadeddata:            null;
    }
    
    export interface PlayerInstanceVideo {
        sourceNode: InnerContainer;
    }
    
    export interface PlayerInstanceVideoConfig {
        controls:                boolean;
        autoplay:                boolean;
        playsinline:             boolean;
        "x5-playsinline":        boolean;
        "webkit-playsinline":    boolean;
        tabindex:                number;
        mediaType:               string;
        "data-index":            number;
        crossorigin:             string;
        disablePictureInPicture: boolean;
    }
    
    export interface VideoPos {
        pi:     number;
        scale:  number;
        rotate: number;
        x:      number;
        y:      number;
        h:      number;
        w:      number;
        vy:     number;
        vx:     number;
    }
    
    export interface VODLogger {
        eventQueue:        any[];
        line_app_id:       number;
        line_user_id:      string;
        playerCoreVersion: string;
        closeSeekLog:      boolean;
        start_time:        number;
        playlogs:          Playlogs;
        degradeLog:        DegradeLog;
        buffers:           Buffers;
        netLog:            NetLog;
        merror:            Merror;
        exInfo:            ExInfo;
        startStep:         number;
        bft:               number;
        inWaitingStart:    number;
        waitStartTime:     number;
        lastVideoTime:     number;
        lastOperaTime:     number;
        lastEventTime:     number;
        stallIntervalId:   null;
        seekLog:           SeekLog;
        resLogs:           ResLogs;
        apiLog:            APILog;
        errorLog:          ErrorLog;
        pauseLog:          PauseLog;
        stall:             Stall;
        load_state:        number;
        lv_method:         number;
        isSeeking:         boolean;
        isEnded:           boolean;
        isAutoplay:        number;
        abrInfo:           ABRInfo;
        urlLog:            URLLog;
        tracker:           Tracker;
        commonParams:      Params;
        listeners:         Listener[];
    }
    
    export interface ABRInfo {
        abr_general_info: InnerContainer;
        abr_event_info:   ABREventInfo;
        abr_play_info:    ABRPlayInfo;
        abr_user_info:    ABRUserInfo;
        abr_init_opts:    InnerContainer;
    }
    
    export interface ABREventInfo {
        video_switch: any[];
        video_stall:  any[];
        video_exit:   InnerContainer;
    }
    
    export interface ABRPlayInfo {
        start_play_time_ms: number;
        is_hint:            number;
        playback_info:      PlaybackInfo;
    }
    
    export interface PlaybackInfo {
        internet_speed_record: any[];
        play_bitrate_record:   any[];
        buffer_length_record:  any[];
        play_speed_record:     any[];
    }
    
    export interface ABRUserInfo {
        cancel_abr: number;
    }
    
    export interface APILog {
        code:    number;
        message: string;
        logid:   string;
        api:     string;
        auth:    string;
        error:   InnerContainer;
    }
    
    export interface Buffers {
        allBuffer: AllBuffer[];
        curBuffer: CurBuffer;
    }
    
    export interface AllBuffer {
        s: number;
        e: number;
    }
    
    export interface CurBuffer {
        buf_diff:    number;
        buf_s_pos:   number;
        buf_e_pos:   number;
        buf_include: number;
    }
    
    export interface Params {
        play_type:        number;
        source_type:      string;
        sdk_version:      string;
        pc:               string;
        line_app_id:      number;
        line_user_id:     string;
        app_version:      string;
        platform:         string;
        cpu_core:         number;
        memory_size:      number;
        support:          number;
        webdriver:        number;
        player_sessionid: string;
        web_url:          string;
        user_agent:       string;
    }
    
    export interface DegradeLog {
        bu_acu_t:   number;
        bc:         number;
        watch_dur:  number;
        hasSendEnd: boolean;
    }
    
    export interface ErrorLog {
        accu_errc:   number;
        try_err_c:   number;
        errt:        number;
        errc:        number;
        fir_errt:    number;
        fir_errc:    number;
        last_errors: any[];
        message:     string;
    }
    
    export interface ExInfo {
        stall: any[];
    }
    
    export interface Listener {
        evt: string;
    }
    
    export interface Merror {
        cdn:       any[];
        player:    any[];
        playCatch: any[];
        expied:    any[];
    }
    
    export interface NetLog {
        downloadSpeed: number;
        requestCount:  number;
        connectCost:   number;
        totalSpeed:    number;
        rqCount:       number;
        status:        number;
    }
    
    export interface PauseLog {
        pause_acu_t: number;
        isPausing:   boolean;
        pause_start: number;
    }
    
    export interface Playlogs {
        nt:          number;
        vt:          number;
        rt:          number;
        at:          number;
        pt:          number;
        bu_acu_t:    number;
        bc:          number;
        br:          number;
        fbrt:        string;
        dbc:         number;
        de_bu_acu_t: number;
        nbc:         number;
        n_bu_acu_t:  number;
        played:      Played[];
        degrade:     string;
        lc:          number;
    }
    
    export interface Played {
        begin: number;
        end:   number;
    }
    
    export interface ResLogs {
        lastSwitchStartTime: number;
        switch_count:        number;
        abr_switch_count:    number;
        initial_resolution:  string;
        final_resolution:    string;
        ldst:                number;
        ldet:                number;
        df:                  string;
        lf:                  string;
        played:              Played[];
        bc:                  number;
        bu_acu_t:            number;
        sc:                  number;
        sat:                 number;
        buf:                 number;
        lbuf:                number;
        lplayed:             number;
        vs:                  number;
        vds:                 number;
        vps:                 number;
        vis:                 number;
        bitrate:             number;
    }
    
    export interface SeekLog {
        intervalId:        number;
        lastSeekStartTime: number;
        seekBefore:        number;
        sat:               number;
        sc:                number;
        buf_include:       number;
    }
    
    export interface Stall {
        sc:     number;
        startf: number;
        endf:   number;
        start:  number;
        end:    number;
        cost:   number;
        acc:    number;
    }
    
    export interface Tracker {
        disableAutoPageView: boolean;
        bridgeReport:        boolean;
        staging:             boolean;
        pluginInstances:     PluginInstance[];
        sended:              boolean;
        started:             boolean;
        destroy:             boolean;
        sdkReady:            boolean;
        adapters:            InnerContainer;
        loadType:            string;
        sdkStop:             boolean;
        name:                string;
        hook:                InnerContainer;
        remotePlugin:        InnerContainer;
        Types:               { [key: string]: string };
        logger:              TrackerLogger;
        spider:              Spider;
        appBridge:           InnerContainer;
        requestManager:      RequestManager;
        configManager:       ConfigManager;
        debugger:            Debugger;
        initConfig:          InitConfigClass;
        eventManager:        EventManager;
        tokenManager:        TokenManager;
        sessionManager:      SessionManager;
        inited:              boolean;
    }
    
    export interface ConfigManager {
        is_first_time:  boolean;
        configPersist:  boolean;
        initConfig:     InitConfigClass;
        eventCheck:     EventCheck;
        configKey:      string;
        sessionStorage: InnerContainer;
        localStorage:   InnerContainer;
        envInfo:        EnvInfo;
        ab_version:     string;
        evtParams:      Params;
        isLast:         boolean;
        domain:         string;
        ab_cache:       AbCache;
    }
    
    export interface AbCache {
        data:                 InnerContainer;
        uuid:                 string;
        timestamp:            number;
        ab_version_multilink: any[];
        ab_ext_version:       any[];
        ab_version:           any[];
    }
    
    export interface EnvInfo {
        user:   User;
        header: Header;
    }
    
    export interface Header {
        app_id:          number;
        os_name:         string;
        os_version:      string;
        device_model:    string;
        language:        string;
        platform:        string;
        sdk_version:     string;
        sdk_lib:         string;
        timezone:        number;
        tz_offset:       number;
        resolution:      string;
        browser:         string;
        browser_version: string;
        referrer:        string;
        referrer_host:   string;
        width:           number;
        height:          number;
        screen_width:    number;
        screen_height:   number;
        tracer_data:     string;
        custom:          Custom;
    }
    
    export interface Custom {
        network_type: string;
    }
    
    export interface User {
        user_unique_id: string;
        web_id:         string;
    }
    
    export interface EventCheck {
        config:              InitConfigClass;
        eventNameWhiteList:  string[];
        paramsNameWhiteList: string[];
        regStr:              InnerContainer;
    }
    
    export interface InitConfigClass {
        app_id:              number;
        channel:             ChannelEnum;
        log:                 boolean;
        disable_sdk_monitor: boolean;
        disable_heartbeat:   boolean;
        enable_ab_test:      boolean;
    }
    
    export interface Debugger {
        devToolReady:  boolean;
        devToolOrigin: string;
        sendAlready:   boolean;
        config:        InitConfigClass;
        app_id:        number;
        cacheStorgae:  InnerContainer;
        loadUrl:       string;
        filterEvent:   InnerContainer;
    }
    
    export interface EventManager {
        eventLimit:      number;
        eventCache:      any[];
        beconEventCache: any[];
        config:          InitConfigClass;
        configManager:   ConfigManager;
        eventCheck:      EventCheck;
        cacheStorgae:    InnerContainer;
        localStorage:    InnerContainer;
        maxReport:       number;
        reportTime:      number;
        timeout:         number;
        reportUrl:       string;
        eventKey:        string;
        beconKey:        string;
        abKey:           string;
        refer_key:       string;
        pageId:          string;
        reportTimeout:   null;
    }
    
    export interface TrackerLogger {
        isLog: boolean;
        name:  string;
    }
    
    export interface PluginInstance {
        config?:             InitConfigClass;
        channel?:            ChannelEnum;
        fetchStatus?:        string;
        refreshFetchStatus?: string;
        versions?:           any[];
        extVersions?:        any[];
        mulilinkVersions?:   any[];
        enable_multilink?:   boolean;
        enable_ab_visual?:   boolean;
        editMode?:           boolean;
        callbacks?:          any[];
        data?:               null;
        changeListener?:     InnerContainer;
        readyStatus?:        boolean;
        exposureCache?:      any[];
        autoTrackStart?:     boolean;
        duration?:           number;
        reportUrl?:          string;
        eventCheck?:         EventCheck;
        cache?:              InnerContainer;
        retryWaitTime?:      number;
        retryStatus?:        boolean;
        retryCacheStatus?:   boolean;
        autotrack?:          boolean;
        spa?:                boolean;
        allowHash?:          boolean;
    }
    
    export interface RequestManager {
        config:        InitConfigClass;
        requestType:   string;
        supportBeacon: boolean;
        errorCode:     ErrorCode;
        customHeader:  InnerContainer;
    }
    
    export interface ErrorCode {
        NO_URL:       number;
        IMG_ON:       number;
        IMG_CATCH:    number;
        BEACON_FALSE: number;
        XHR_ON:       number;
        RESPONSE:     number;
        TIMEOUT:      number;
    }
    
    export interface SessionManager {
        storage:    InnerContainer;
        sessionKey: string;
        expireTime: number;
        sessionExp: number;
    }
    
    export interface Spider {
        spiderBot: string[];
    }
    
    export interface TokenManager {
        cacheToken:    CacheToken;
        config:        InitConfigClass;
        configManager: ConfigManager;
        storage:       InnerContainer;
        tokenKey:      string;
        expiresTime:   number;
        cookieDomain:  string;
        tokenType:     string;
        tokenReady:    boolean;
    }
    
    export interface CacheToken {
        web_id:         string;
        user_unique_id: string;
        timestamp:      number;
    }
    
    export interface URLLog {
        initial_url:  string;
        initial_host: string;
        initial_ip:   string;
    }
    
}

// prettier-ignore
export namespace DouyinResponses {

    // GET https://www-hj.douyin.com/aweme/v1/web/aweme/post/?xxx
    export namespace GET_aweme_post {
        export interface Root {
            status_code:           number;
            min_cursor:            number;
            max_cursor:            number;
            has_more:              number;
            aweme_list:            AwemeList[];
            time_list:             null;
            log_pb:                LogPb;
            has_locate_item:       boolean;
            locate_item_available: boolean;
            locate_item_cursor:    number;
            request_item_cursor:   number;
            post_serial:           number;
            replace_series_cover:  number;
        }
        
        export interface AwemeList {
            aweme_id:                            string;
            desc:                                string;
            create_time:                         number;
            author:                              Author;
            music:                               Music;
            ai_prompt:                           AIPrompt;
            video:                               Video;
            share_url:                           string;
            user_digged:                         number;
            statistics:                          Statistics;
            status:                              Status;
            can_cache_to_local:                  boolean;
            text_extra:                          TextExtra[];
            is_top:                              number;
            aweme_listen_struct:                 AwemeListenStruct;
            share_info:                          AwemeListShareInfo;
            follow_shot_assets:                  null;
            video_labels:                        null;
            is_moment_history:                   number;
            is_ads:                              boolean;
            item_aigc_follow_shot:               number;
            duration:                            number;
            aweme_type:                          number;
            nearby_hot_comment:                  null;
            enable_decorated_emoji:              boolean;
            image_infos:                         null;
            risk_infos:                          RiskInfos;
            cf_assets_type:                      number;
            origin_duet_resource_uri:            string;
            position:                            null;
            uniqid_position:                     null;
            comment_list:                        null;
            author_user_id:                      number;
            sec_item_id:                         string;
            geofencing:                          any[];
            interest_points:                     null;
            series_basic_info:                   ImageComment;
            region:                              string;
            video_text:                          null;
            ent_log_extra:                       EntLogExtra;
            collect_stat:                        number;
            label_top_text:                      null;
            promotions:                          any[];
            group_id:                            string;
            prevent_download:                    boolean;
            nickname_position:                   null;
            challenge_position:                  null;
            is_moment_story:                     number;
            flash_mob_trends:                    number;
            trends_infos:                        null;
            long_video:                          null;
            entertainment_video_paid_way:        EntertainmentVideoPaidWay;
            entertainment_video_type:            number;
            chapter_bar_color:                   null;
            effect_inflow_effects:               null;
            interaction_stickers:                null;
            component_control:                   ComponentControl;
            origin_comment_ids:                  null;
            commerce_config_data:                null;
            ai_follow_images:                    null;
            video_control:                       VideoControl;
            aweme_control:                       AwemeControl;
            is_25_story:                         number;
            product_genre_info:                  ProductGenreInfo;
            anchor_info?:                        AnchorInfo;
            original_anchor_type?:               number;
            is_from_ad_auth:                     boolean;
            anchors:                             null;
            hybrid_label:                        null;
            geofencing_regions:                  null;
            follow_shoot_clip_info:              FollowShootClipInfo;
            aweme_acl?:                          AwemeACL;
            mv_info:                             null;
            is_story:                            number;
            trends_event_track:                  TrendsEventTrack;
            aweme_type_tags:                     string;
            is_subtitled?:                       number;
            cover_labels:                        null;
            douplus_user_type:                   number;
            game_tag_info:                       GameTagInfo;
            guide_btn_type:                      number;
            select_anchor_expanded_content:      number;
            publish_plus_alienation:             PublishPlusAlienation;
            images:                              null;
            relation_labels:                     null;
            is_new_text_mode:                    number;
            impression_data:                     ImpressionData;
            shoot_way:                           ShootWay;
            personal_page_botton_diagnose_style: number;
            libfinsert_task_id:                  string;
            social_tag_list:                     null;
            suggest_words?:                      SuggestWords;
            show_follow_button:                  ImageComment;
            duet_aggregate_in_music_tab:         boolean;
            is_duet_sing:                        boolean;
            comment_permission_info:             CommentPermissionInfo;
            original_images:                     null;
            series_paid_info:                    SeriesPaidInfo;
            img_bitrate:                         null;
            comment_gid:                         number;
            image_album_music_info:              ImageAlbumMusicInfo;
            video_tag:                           VideoTag[];
            is_collects_selected:                number;
            chapter_list:                        null;
            feed_comment_config:                 FeedCommentConfig;
            is_image_beat:                       boolean;
            dislike_dimension_list:              null;
            standard_bar_info_list:              null;
            photo_search_entrance:               PhotoSearchEntrance;
            danmaku_control:                     DanmakuControl;
            is_life_item:                        boolean;
            image_list:                          null;
            component_info_v2:                   ComponentInfoV2;
            item_warn_notification:              ItemWarnNotification;
            origin_text_extra:                   null;
            disable_relation_bar:                number;
            packed_clips:                        null;
            vtag_search?:                        VtagSearch;
            author_mask_tag:                     number;
            user_recommend_status:               number;
            collection_corner_mark:              number;
            is_share_post:                       boolean;
            image_comment:                       ImageComment;
            visual_search_info:                  VisualSearchInfo;
            tts_id_list:                         null;
            ref_tts_id_list:                     null;
            voice_modify_id_list:                null;
            ref_voice_modify_id_list:            null;
            authentication_token:                string;
            video_game_data_channel_config:      ImageComment;
            dislike_dimension_list_v2:           null;
            distribute_circle:                   DistributeCircle;
            image_crop_ctrl:                     number;
            yumme_recreason:                     null;
            slides_music_beats:                  null;
            jump_tab_info_list:                  null;
            media_type:                          number;
            play_progress:                       PlayProgress;
            reply_smart_emojis:                  null;
            activity_video_type:                 number;
            boost_status:                        number;
            create_scale_type:                   CreateScaleType[];
            entertainment_product_info:          EntertainmentProductInfo;
            caption:                             string;
            item_title:                          string;
            is_use_music:                        boolean;
            original:                            number;
            xigua_base_info:                     XiguaBaseInfo;
            mark_largely_following:              boolean;
            friend_recommend_info:               FriendRecommendInfo;
            enable_comment_sticker_rec:          boolean;
            video_share_edit_status:             number;
            is_24_story:                         number;
            life_anchor_show_extra?:             LifeAnchorShowExtra;
            horizontal_type?:                    number;
            main_arch_common?:                   string;
            galileo_pad_textcrop?:               GalileoPadTextcrop;
        }
        
        export interface AIPrompt {
            text:   Text;
            source: number;
        }
        
        export enum Text {
            点击开启AI创作 = "点击开启AI创作",
        }
        
        export interface AnchorInfo {
            type:       number;
            id:         string;
            icon:       Icon;
            title:      string;
            open_url:   string;
            web_url:    string;
            mp_url:     string;
            title_tag:  string;
            content:    TrendsEventTrack;
            style_info: StyleInfo;
            extra:      string;
            log_extra:  string;
        }
        
        export enum TrendsEventTrack {
            Empty = "{}",
            HasDanmaku1 = "{\"has_danmaku\":1}",
        }
        
        export interface Icon {
            uri:      string;
            url_list: string[];
            width:    number;
            height:   number;
            url_key?: string;
        }
        
        export interface StyleInfo {
            default_icon: string;
            scene_icon:   string;
            extra:        string;
        }
        
        export interface Author {
            uid:                                        string;
            signature_extra:                            null;
            nickname:                                   Nickname;
            personal_tag_list:                          null;
            homepage_bottom_toast:                      null;
            avatar_thumb:                               Icon;
            batch_unfollow_contain_tabs:                null;
            not_seen_item_id_list:                      null;
            follow_status:                              number;
            contrail_list:                              null;
            story25_comment:                            number;
            data_label_list:                            null;
            custom_verify:                              string;
            follower_list_secondary_information_struct: null;
            display_info:                               null;
            card_sort_priority:                         null;
            private_relation_list:                      null;
            user_tags:                                  null;
            share_info:                                 AuthorShareInfo;
            can_set_geofencing:                         null;
            sec_uid:                                    string;
            need_points:                                null;
            enterprise_verify_reason:                   string;
            is_ad_fake:                                 boolean;
            story_interactive:                          number;
            link_item_list:                             null;
            card_entries:                               null;
            creator_tag_list:                           null;
            user_permissions:                           null;
            text_extra:                                 null;
            card_entries_not_display:                   null;
            prevent_download:                           boolean;
            special_people_labels:                      null;
            white_cover_url:                            null;
            endorsement_info_list:                      null;
            follower_status:                            number;
            profile_mob_params:                         null;
            familiar_visitor_user:                      null;
            avatar_schema_list:                         null;
            cover_url:                                  Icon[];
            cf_list:                                    null;
            im_role_ids:                                null;
            not_seen_item_id_list_v2:                   null;
            offline_info_list:                          null;
            risk_notice_text:                           string;
            ban_user_functions:                         null;
            story_ttl:                                  number;
            verification_permission_ids:                null;
            profile_component_disabled:                 null;
            identity_labels:                            null;
            interest_tags:                              null;
            batch_unfollow_relation_desc:               null;
        }
        
        export enum Nickname {
            Master = "Master",
        }
        
        export interface AuthorShareInfo {
            share_url:          string;
            share_weibo_desc:   string;
            share_desc:         string;
            share_title:        string;
            share_qrcode_url:   Icon;
            share_title_myself: string;
            share_title_other:  string;
            share_desc_info:    string;
        }
        
        export interface AwemeACL {
            download_mask_panel: DownloadMaskPanel;
        }
        
        export interface DownloadMaskPanel {
            code:      number;
            show_type: number;
        }
        
        export interface AwemeControl {
            can_forward:      boolean;
            can_share:        boolean;
            can_comment:      boolean;
            can_show_comment: boolean;
        }
        
        export interface AwemeListenStruct {
            trace_info: string;
        }
        
        export interface CommentPermissionInfo {
            comment_permission_status: number;
            can_comment:               boolean;
            item_detail_entry:         boolean;
            press_entry:               boolean;
            toast_guide:               boolean;
        }
        
        export interface ComponentControl {
            data_source_url: DataSourceURL;
        }
        
        export enum DataSourceURL {
            AwemeV1WebAwemePost = "/aweme/v1/web/aweme/post/",
        }
        
        export enum ComponentInfoV2 {
            DescLinesLimit0HideMarqueeFalse = "{\"desc_lines_limit\":0,\"hide_marquee\":false}",
        }
        
        export enum CreateScaleType {
            FH = "f_h",
            FW = "f_w",
        }
        
        export interface DanmakuControl {
            enable_danmaku:        boolean;
            post_privilege_level:  number;
            is_post_denied:        boolean;
            post_denied_reason:    string;
            skip_danmaku:          boolean;
            danmaku_cnt:           number;
            activities:            Activity[];
            pass_through_params:   TrendsEventTrack;
            smart_mode_decision:   number;
            first_danmaku_offset?: number;
            last_danmaku_offset?:  number;
        }
        
        export interface Activity {
            id:   number;
            type: number;
        }
        
        export interface DistributeCircle {
            distribute_type:          number;
            campus_block_interaction: boolean;
            is_campus:                boolean;
        }
        
        export interface EntLogExtra {
            log_extra: string;
        }
        
        export interface EntertainmentProductInfo {
            sub_title:   null;
            market_info: MarketInfo;
        }
        
        export interface MarketInfo {
            limit_free:    LimitFree;
            marketing_tag: null;
        }
        
        export interface LimitFree {
            in_free: boolean;
        }
        
        export interface EntertainmentVideoPaidWay {
            paid_ways:               any[];
            paid_type:               number;
            enable_use_new_ent_data: boolean;
        }
        
        export interface FeedCommentConfig {
            input_config_text:   string;
            author_audit_status: number;
            common_flags:        string;
        }
        
        export interface FollowShootClipInfo {
            clip_video_all:      number;
            clip_from_platform?: number;
            origin_clip_id?:     number;
            clip_from_user?:     number;
        }
        
        export interface FriendRecommendInfo {
            friend_recommend_source:              number;
            label_user_list:                      null;
            disable_friend_recommend_guide_label: boolean;
        }
        
        export interface GalileoPadTextcrop {
            ipad_d_h_cut_ratio:    number[] | null;
            ipad_d_v_cut_ratio:    number[] | null;
            android_d_h_cut_ratio: number[] | null;
            android_d_v_cut_ratio: number[] | null;
            version:               number;
        }
        
        export interface GameTagInfo {
            is_game: boolean;
        }
        
        export interface ImageAlbumMusicInfo {
            begin_time: number;
            end_time:   number;
            volume:     number;
        }
        
        export interface ImageComment {
        }
        
        export interface ImpressionData {
            group_id_list_a:   any[];
            group_id_list_b:   number[];
            similar_id_list_a: null;
            similar_id_list_b: null;
            group_id_list_c:   any[];
            group_id_list_d:   any[];
        }
        
        export interface ItemWarnNotification {
            type:    number;
            show:    boolean;
            content: string;
        }
        
        export interface LifeAnchorShowExtra {
            anchor_type:     number;
            should_show:     boolean;
            has_anchor_info: boolean;
            extra:           Extra;
        }
        
        export enum Extra {
            IsCommerceIntention0IsNewAnchorFrame0 = "{\"is_commerce_intention\":\"0\",\"is_new_anchor_frame\":\"0\"}",
        }
        
        export interface Music {
            id:                                 number;
            id_str:                             string;
            title:                              string;
            author:                             string;
            album:                              string;
            cover_hd:                           Icon;
            cover_large:                        Icon;
            cover_medium:                       Icon;
            cover_thumb:                        Icon;
            play_url:                           Icon;
            schema_url:                         string;
            source_platform:                    number;
            start_time:                         number;
            end_time:                           number;
            duration:                           number;
            extra:                              string;
            user_count:                         number;
            position:                           null;
            collect_stat:                       number;
            status:                             number;
            offline_desc:                       string;
            owner_id?:                          string;
            owner_nickname:                     string;
            is_original:                        boolean;
            mid:                                string;
            binded_challenge_id:                number;
            redirect:                           boolean;
            is_restricted:                      boolean;
            author_deleted:                     boolean;
            is_del_video:                       boolean;
            is_video_self_see:                  boolean;
            owner_handle:                       string;
            author_position:                    null;
            prevent_download:                   boolean;
            unshelve_countries:                 null;
            prevent_item_download_status:       number;
            external_song_info:                 any[];
            sec_uid?:                           string;
            avatar_thumb?:                      Icon;
            avatar_medium?:                     Icon;
            avatar_large?:                      Icon;
            preview_start_time:                 number;
            preview_end_time:                   number;
            is_commerce_music:                  boolean;
            is_original_sound:                  boolean;
            audition_duration:                  number;
            shoot_duration:                     number;
            reason_type:                        number;
            artists:                            Artist[];
            lyric_short_position:               null;
            mute_share:                         boolean;
            tag_list:                           null;
            dmv_auto_show:                      boolean;
            is_pgc:                             boolean;
            is_matched_metadata:                boolean;
            is_audio_url_with_cookie:           boolean;
            matched_pgc_sound?:                 MatchedPgcSound;
            music_chart_ranks:                  null;
            can_background_play:                boolean;
            music_status:                       number;
            video_duration:                     number;
            pgc_music_type:                     number;
            author_status?:                     number;
            search_impr:                        SearchImpr;
            song?:                              Song;
            artist_user_infos:                  null;
            dsp_status:                         number;
            musician_user_infos:                null;
            music_collect_count:                number;
            music_cover_atmosphere_color_value: string;
            show_origin_clip:                   boolean;
            strong_beat_url?:                   Icon;
            cover_color_hsv?:                   CoverColorHsv;
            music_image_beats?:                 MusicImageBeats;
        }
        
        export interface Artist {
            uid:         string;
            sec_uid:     string;
            nick_name:   string;
            handle:      string;
            avatar:      AnimatedCover;
            is_verified: boolean;
            enter_type:  number;
        }
        
        export interface AnimatedCover {
            uri:      string;
            url_list: string[];
        }
        
        export interface CoverColorHsv {
            h: number;
            s: number;
            v: number;
        }
        
        export interface MatchedPgcSound {
            author:       string;
            title:        string;
            mixed_title:  string;
            mixed_author: string;
            cover_medium: Icon;
        }
        
        export interface MusicImageBeats {
            music_image_beats_url: Icon;
        }
    
        
        export interface SearchImpr {
            entity_id: string;
        }
        
        export interface Song {
            id:              number;
            id_str:          string;
            artists:         null;
            chorus_v3_infos: null;
            title?:          string;
            chorus?:         Chorus;
        }
        
        export interface Chorus {
            start_ms:    number;
            duration_ms: number;
        }
        
        export interface PhotoSearchEntrance {
            ecom_type: number;
        }
        
        export interface PlayProgress {
            play_progress:      number;
            last_modified_time: number;
        }
        
        export interface ProductGenreInfo {
            product_genre_type:          number;
            material_genre_sub_type_set: number[];
            special_info:                SpecialInfo;
        }
        
        export interface SpecialInfo {
            recommend_group_name: number;
        }
        
        export interface PublishPlusAlienation {
            alienation_type: number;
        }
        
        export interface RiskInfos {
            vote:      boolean;
            warn:      boolean;
            risk_sink: boolean;
            type:      number;
            content:   string;
        }
        
        export interface SeriesPaidInfo {
            series_paid_status: number;
            item_price:         number;
        }
        
        export interface AwemeListShareInfo {
            share_url:       string;
            share_link_desc: string;
        }
        
        export enum ShootWay {
            DirectShoot = "direct_shoot",
        }
        
        export interface Statistics {
            recommend_count: number;
            comment_count:   number;
            digg_count:      number;
            admire_count:    number;
            play_count:      number;
            share_count:     number;
            collect_count:   number;
        }
        
        export interface Status {
            not_allow_soft_del_reason:      NotAllowSoftDelReason;
            is_delete:                      boolean;
            allow_share:                    boolean;
            review_result:                  ReviewResult;
            allow_friend_recommend_guide:   boolean;
            part_see:                       number;
            private_status:                 number;
            listen_video_status:            number;
            in_reviewing:                   boolean;
            allow_self_recommend_to_friend: boolean;
            allow_friend_recommend:         boolean;
            is_prohibited:                  boolean;
            enable_soft_delete:             number;
        }
        
        export enum NotAllowSoftDelReason {
            Ab = "ab",
        }
        
        export interface ReviewResult {
            review_status: number;
        }
        
        export interface SuggestWords {
            suggest_words: SuggestWord[];
        }
        
        export interface SuggestWord {
            words:      Word[];
            scene:      string;
            icon_url:   string;
            hint_text:  string;
            extra_info: string;
        }
        
        export interface Word {
            word:    string;
            word_id: string;
            info:    string;
        }
        
        export interface TextExtra {
            start:         number;
            end:           number;
            type:          number;
            hashtag_name:  string;
            hashtag_id:    string;
            is_commerce:   boolean;
            caption_start: number;
            caption_end:   number;
        }
        
        export interface Video {
            play_addr:         PlayAddr;
            cover:             Icon;
            height:            number;
            width:             number;
            dynamic_cover:     Icon;
            origin_cover:      Icon;
            ratio:             Ratio;
            format:            Format;
            big_thumbs:        BigThumb[];
            meta:              string;
            bit_rate:          BitRate[];
            duration:          number;
            bit_rate_audio:    BitRateAudio[] | null;
            gaussian_cover:    Icon;
            play_addr_265:     PlayAddr;
            audio:             Audio;
            play_addr_h264:    PlayAddr;
            raw_cover:         Icon;
            animated_cover:    AnimatedCover;
            is_source_HDR:     number;
            video_model:       string;
            horizontal_type?:  number;
            is_long_video?:    number;
            use_static_cover?: boolean;
        }
        
        export interface Audio {
            original_sound_infos: null;
        }
        
        export interface BigThumb {
            img_num:    number;
            uri:        string;
            img_url:    string;
            img_x_size: number;
            img_y_size: number;
            img_x_len:  number;
            img_y_len:  number;
            duration:   number;
            interval:   number;
            fext:       Fext;
            uris:       string[];
            img_urls:   string[];
        }
        
        export enum Fext {
            Jpg = "jpg",
        }
        
        export interface BitRate {
            gear_name:    string;
            quality_type: number;
            bit_rate:     number;
            play_addr:    PlayAddr;
            is_h265:      number;
            is_bytevc1:   number;
            HDR_type:     string;
            HDR_bit:      string;
            FPS:          number;
            video_extra:  string;
            format:       Format;
        }
        
        export enum Format {
            Dash = "dash",
            Mp4 = "mp4",
        }
        
        export interface PlayAddr {
            uri:        string;
            url_list:   string[];
            width:      number;
            height:     number;
            url_key:    string;
            data_size?: number;
            file_hash:  string;
            file_cs?:   string;
        }
        
        export interface BitRateAudio {
            audio_meta:    AudioMeta;
            audio_quality: number;
            audio_extra:   string;
        }
        
        export interface AudioMeta {
            url_list:     URLList;
            encoded_type: EncodedType;
            media_type:   MediaType;
            logo_type:    string;
            quality:      string;
            quality_desc: string;
            format:       Format;
            bitrate:      number;
            codec_type:   CodecType;
            size:         number;
            fps:          number;
            file_id:      string;
            file_hash:    string;
            sub_info:     string;
        }
        
        export enum CodecType {
            Bytevc1 = "bytevc1",
            H264 = "h264",
        }
        
        export enum EncodedType {
            Normal = "normal",
        }
        
        export enum MediaType {
            Audio = "audio",
        }
        
        export interface URLList {
            main_url:     string;
            backup_url:   string;
            fallback_url: string;
        }
        
        export enum Ratio {
            The540P = "540p",
            The720P = "720p",
        }
        
        export interface VideoControl {
            allow_download:             boolean;
            share_type:                 number;
            show_progress_bar:          number;
            draft_progress_bar:         number;
            allow_duet:                 boolean;
            allow_react:                boolean;
            prevent_download_type:      number;
            allow_dynamic_wallpaper:    boolean;
            timer_status:               number;
            allow_music:                boolean;
            allow_stitch:               boolean;
            allow_douplus:              boolean;
            allow_share:                boolean;
            share_grayed:               boolean;
            download_ignore_visibility: boolean;
            duet_ignore_visibility:     boolean;
            share_ignore_visibility:    boolean;
            download_info:              DownloadInfo;
            duet_info:                  DuetInfo;
            allow_record:               boolean;
            disable_record_reason:      string;
            timer_info:                 TimerInfo;
        }
        
        export interface DownloadInfo {
            level:      number;
            fail_info?: DownloadInfoFailInfo;
        }
        
        export interface DownloadInfoFailInfo {
            code:   number;
            reason: Reason;
            msg:    string;
        }
        
        export enum Reason {
            IsolationContent = "isolation_content",
        }
        
        export interface DuetInfo {
            level:      number;
            fail_info?: DuetInfoFailInfo;
        }
        
        export interface DuetInfoFailInfo {
            code:   number;
            reason: string;
        }
        
        export interface TimerInfo {
            public_time?:  number;
            timer_status?: number;
        }
        
        export interface VideoTag {
            tag_id:   number;
            tag_name: string;
            level:    number;
        }
        
        export interface VisualSearchInfo {
            visual_search_longpress?: number;
            is_show_img_entrance:     boolean;
            is_ecom_img:              boolean;
            is_high_accuracy_ecom:    boolean;
            is_high_recall_ecom:      boolean;
        }
        
        export interface VtagSearch {
            vtag_enable?:         boolean;
            vtag_delay_ts?:       number;
            default_vtag_data?:   string;
            default_vtag_enable?: boolean;
        }
        
        export interface XiguaBaseInfo {
            status:              number;
            star_altar_order_id: number;
            star_altar_type:     number;
            item_id:             number;
        }
        
        export interface LogPb {
            impr_id: string;
        }
        
    }

    // GET https://www.douyin.com/aweme/v1/web/general/search/single/?xxx
    export namespace GET_search_single {
        export interface Root {
            status_code:           number;
            data:                  Datum[];
            qc:                    string;
            cursor:                number;
            has_more:              number;
            ad_info:               AdInfo;
            extra:                 Extra;
            log_pb:                LogPb;
            guide_search_words:    null;
            global_doodle_config:  GlobalDoodleConfig;
            polling_time:          number;
            time_cost:             TimeCost;
            ops:                   null;
            multi_columns_info:    MultiColumnsInfo;
            douyin_ai_search_info: DouyinAISearchInfo;
            path:                  string;
            mock_recall_path:      string;
        }
        
        export interface AdInfo {
        }
        
        export interface Datum {
            type:                number;
            aweme_info:          AwemeInfo;
            doc_type:            number;
            sub_card_list:       null;
            provider_doc_id:     number;
            provider_doc_id_str: string;
            tab:                 null;
            show_tab:            null;
            debug_diff_info:     AdInfo;
            aweme_list:          null;
            ecom_goods_list:     null;
            music_info_list:     null;
            card_unique_name:    string;
            ops:                 null;
            qishui_music_list:   null;
        }
        
        export interface AwemeInfo {
            aweme_id:                   string;
            desc:                       string;
            create_time:                number;
            author:                     Author;
            music:                      Music;
            cha_list:                   null;
            video:                      Video;
            user_digged:                number;
            statistics:                 Statistics;
            status:                     Status;
            text_extra:                 TextExtra[];
            is_top:                     number;
            share_info:                 ShareInfo;
            video_labels:               null;
            aweme_type:                 number;
            image_infos:                null;
            position:                   null;
            uniqid_position:            null;
            comment_list:               null;
            author_user_id:             number;
            geofencing:                 null;
            video_text:                 null;
            collect_stat:               number;
            label_top_text:             null;
            promotions:                 null;
            group_id:                   string;
            prevent_download:           boolean;
            nickname_position:          null;
            challenge_position:         null;
            long_video:                 null;
            interaction_stickers:       null;
            origin_comment_ids:         null;
            commerce_config_data:       null;
            video_control:              VideoControl;
            anchors:                    null;
            rawdata:                    string;
            hybrid_label:               null;
            geofencing_regions:         null;
            cover_labels:               null;
            images:                     Image[] | null;
            relation_labels:            null;
            impression_data:            ImpressionData;
            social_tag_list:            null;
            suggest_words:              SuggestWords;
            original_images:            null;
            img_bitrate:                null;
            video_tag:                  null;
            chapter_list:               null;
            dislike_dimension_list:     null;
            standard_bar_info_list:     null;
            image_list:                 null;
            origin_text_extra:          null;
            packed_clips:               null;
            tts_id_list:                null;
            ref_tts_id_list:            null;
            voice_modify_id_list:       null;
            ref_voice_modify_id_list:   null;
            dislike_dimension_list_v2:  null;
            yumme_recreason:            null;
            slides_music_beats:         null;
            jump_tab_info_list:         null;
            media_type:                 number;
            reply_smart_emojis:         null;
            create_scale_type:          null;
            entertainment_product_info: EntertainmentProductInfo;
            trends_infos:               null;
            chapter_bar_color:          null;
            mv_info:                    null;
            interest_points:            null;
            nearby_hot_comment:         null;
            ai_follow_images:           null;
            follow_shot_assets:         null;
            effect_inflow_effects:      null;
            image_follow_shot_assets:   null;
            danmaku_control?:           DanmakuControl;
        }
        
        export interface Author {
            uid:                                        string;
            nickname:                                   string;
            avatar_thumb:                               AvatarThumb;
            follow_status:                              number;
            follower_count:                             number;
            total_favorited:                            number;
            custom_verify:                              string;
            room_id:                                    number;
            enterprise_verify_reason:                   string;
            followers_detail:                           null;
            platform_sync_info:                         null;
            secret:                                     number;
            geofencing:                                 null;
            follower_status:                            number;
            cover_url:                                  null;
            item_list:                                  null;
            new_story_cover:                            null;
            type_label:                                 null;
            ad_cover_url:                               null;
            relative_users:                             null;
            cha_list:                                   null;
            sec_uid:                                    string;
            need_points:                                null;
            homepage_bottom_toast:                      null;
            room_data:                                  string;
            can_set_geofencing:                         null;
            room_id_str:                                string;
            white_cover_url:                            null;
            user_tags:                                  null;
            ban_user_functions:                         null;
            card_entries:                               null;
            display_info:                               null;
            card_entries_not_display:                   null;
            card_sort_priority:                         null;
            interest_tags:                              null;
            link_item_list:                             null;
            user_permissions:                           null;
            offline_info_list:                          null;
            signature_extra:                            null;
            personal_tag_list:                          null;
            cf_list:                                    null;
            im_role_ids:                                null;
            not_seen_item_id_list:                      null;
            follower_list_secondary_information_struct: null;
            endorsement_info_list:                      null;
            text_extra:                                 null;
            contrail_list:                              null;
            data_label_list:                            null;
            not_seen_item_id_list_v2:                   null;
            special_people_labels:                      null;
            familiar_visitor_user:                      null;
            avatar_schema_list:                         null;
            profile_mob_params:                         null;
            verification_permission_ids:                null;
            batch_unfollow_relation_desc:               null;
            batch_unfollow_contain_tabs:                null;
            creator_tag_list:                           null;
            account_cert_info?:                         string;
            private_relation_list:                      null;
            identity_labels:                            null;
            profile_component_disabled:                 null;
        }
        
        export interface AvatarThumb {
            uri:      string;
            url_list: string[] | null;
            width:    number;
            height:   number;
            url_key?: string;
        }
        
        export interface DanmakuControl {
            enable_danmaku:       boolean;
            post_privilege_level: number;
            is_post_denied:       boolean;
            post_denied_reason:   string;
            activities:           null;
        }
        
        export interface EntertainmentProductInfo {
            sub_title:   null;
            market_info: MarketInfo;
            biz:         number;
        }
        
        export interface MarketInfo {
            limit_free:    LimitFree;
            marketing_tag: null;
        }
        
        export interface LimitFree {
            in_free: boolean;
        }
        
        export interface Image {
            uri:                              string;
            url_list:                         string[];
            download_url_list:                string[];
            height:                           number;
            width:                            number;
            mask_url_list:                    null;
            interaction_stickers:             null;
            watermark_free_download_url_list: null;
        }
        
        export interface ImpressionData {
            group_id_list_a:   null;
            group_id_list_b:   null;
            similar_id_list_a: null;
            similar_id_list_b: null;
            group_id_list_c:   null;
            group_id_list_d:   null;
        }
        
        export interface Music {
            id:                       number;
            id_str:                   string;
            title:                    string;
            author:                   string;
            album:                    string;
            cover_medium:             AvatarThumb;
            cover_thumb:              AvatarThumb;
            play_url:                 AvatarThumb;
            duration:                 number;
            extra:                    string;
            user_count:               number;
            position:                 null;
            collect_stat:             number;
            status:                   number;
            owner_id?:                string;
            owner_nickname:           string;
            is_original:              boolean;
            mid:                      string;
            binded_challenge_id:      number;
            author_position:          null;
            unshelve_countries:       null;
            external_song_info:       null;
            sec_uid?:                 string;
            avatar_thumb?:            AvatarThumb;
            artists:                  null;
            lyric_short_position:     null;
            tag_list:                 null;
            music_chart_ranks:        null;
            artist_user_infos:        null;
            musician_user_infos:      null;
            talent_hashtag_name_list: null;
        }
        
        export interface ShareInfo {
            share_url:       string;
            share_desc:      string;
            share_title:     string;
            share_link_desc: string;
            share_quote:     string;
            share_desc_info: string;
        }
        
        export interface Statistics {
            comment_count:    number;
            digg_count:       number;
            download_count:   number;
            play_count:       number;
            share_count:      number;
            forward_count:    number;
            live_watch_count: number;
            collect_count:    number;
        }
        
        export interface Status {
            is_delete:      boolean;
            allow_share:    boolean;
            is_private:     boolean;
            private_status: number;
            in_reviewing:   boolean;
            is_prohibited:  boolean;
            review_result:  ReviewResult;
            part_see:       number;
        }
        
        export interface ReviewResult {
            review_status: number;
        }
        
        export interface SuggestWords {
            suggest_words: SuggestWord[];
        }
        
        export interface SuggestWord {
            words:      Word[];
            scene:      Scene;
            icon_url:   string;
            hint_text:  string;
            extra_info: ExtraInfo;
        }
        
        export enum ExtraInfo {
            IsLifeIntent1RespFromHitCache = "{\"is_life_intent\":1,\"resp_from\":\"hit_cache\"}",
            RespFromHitCache = "{\"resp_from\":\"hit_cache\"}",
        }
        
        export enum Scene {
            CommentTopRec = "comment_top_rec",
            DetailInboxRex = "detail_inbox_rex",
            FeedBottomRec = "feed_bottom_rec",
        }
        
        export interface Word {
            word:    string;
            word_id: string;
            info:    string;
        }
        
        export interface TextExtra {
            start:         number;
            end:           number;
            type:          number;
            hashtag_name?: string;
            hashtag_id?:   string;
            is_commerce?:  boolean;
            user_id?:      string;
            sec_uid?:      string;
        }
        
        export interface Video {
            play_addr:                      DownloadAddr;
            cover:                          AvatarThumb;
            height:                         number;
            width:                          number;
            origin_cover:                   AvatarThumb;
            ratio:                          string;
            bit_rate:                       BitRate[] | null;
            duration:                       number;
            tags:                           null;
            big_thumbs:                     BigThumb[] | null;
            meta:                           string;
            bit_rate_audio:                 BitRateAudio[] | null;
            dynamic_cover?:                 AvatarThumb;
            download_addr?:                 DownloadAddr;
            play_addr_lowbr?:               DownloadAddr;
            download_suffix_logo_addr?:     DownloadAddr;
            has_download_suffix_logo_addr?: boolean;
            play_addr_265?:                 DownloadAddr;
            video_model?:                   string;
            gaussian_cover?:                AvatarThumb;
            raw_cover?:                     AvatarThumb;
        }
        
        export interface BigThumb {
            img_num:    number;
            uri:        string;
            img_url:    string;
            img_x_size: number;
            img_y_size: number;
            img_x_len:  number;
            img_y_len:  number;
            duration:   number;
            interval:   number;
            fext:       string;
            uris:       string[] | null;
            img_urls:   string[] | null;
        }
        
        export interface BitRate {
            gear_name:    string;
            quality_type: number;
            bit_rate:     number;
            play_addr:    DownloadAddr;
            is_h265:      number;
            is_bytevc1:   number;
            HDR_type:     string;
            HDR_bit:      string;
            FPS:          number;
            video_extra:  string;
            format:       Format;
        }
        
        export enum Format {
            Dash = "dash",
            Mp4 = "mp4",
        }
        
        export interface DownloadAddr {
            uri:        string;
            url_list:   string[];
            width:      number;
            height:     number;
            url_key?:   string;
            data_size?: number;
            file_hash?: string;
            file_cs?:   string;
        }
        
        export interface BitRateAudio {
            audio_meta:    AudioMeta;
            audio_quality: number;
            audio_extra:   string;
        }
        
        export interface AudioMeta {
            url_list:     URLList;
            encoded_type: string;
            media_type:   string;
            logo_type:    string;
            quality:      string;
            quality_desc: string;
            format:       Format;
            bitrate:      number;
            codec_type:   string;
            size:         number;
            fps:          number;
            file_id:      string;
            file_hash:    string;
            sub_info:     string;
        }
        
        export interface URLList {
            main_url:     string;
            backup_url:   string;
            fallback_url: string;
        }
        
        export interface VideoControl {
            allow_download:             boolean;
            share_type:                 number;
            show_progress_bar:          number;
            draft_progress_bar:         number;
            allow_duet:                 boolean;
            allow_react:                boolean;
            prevent_download_type:      number;
            allow_dynamic_wallpaper:    boolean;
            timer_status:               number;
            allow_music:                boolean;
            allow_stitch:               boolean;
            allow_douplus:              boolean;
            allow_share:                boolean;
            share_grayed:               boolean;
            download_ignore_visibility: boolean;
            duet_ignore_visibility:     boolean;
            share_ignore_visibility:    boolean;
            download_info:              DownloadInfo;
            duet_info:                  DuetInfo;
            allow_record:               boolean;
            disable_record_reason:      string;
            timer_info:                 TimerInfo;
        }
        
        export interface DownloadInfo {
            level:      number;
            fail_info?: DownloadInfoFailInfo;
        }
        
        export interface DownloadInfoFailInfo {
            code:   number;
            reason: string;
            msg?:   string;
        }
        
        export interface DuetInfo {
            level:      number;
            fail_info?: DuetInfoFailInfo;
        }
        
        export interface DuetInfoFailInfo {
            code:   number;
            reason: string;
        }
        
        export interface TimerInfo {
            timer_status: number;
        }
        
        export interface DouyinAISearchInfo {
            is_simple_qa_intent: boolean;
            is_hit_high_risk:    boolean;
            ai_search_req_patch: AdInfo;
        }
        
        export interface Extra {
            now:               number;
            logid:             string;
            fatal_item_ids:    any[];
            search_request_id: string;
            scenes:            null;
        }
        
        export interface GlobalDoodleConfig {
            keyword: string;
        }
        
        export interface LogPb {
            impr_id: string;
        }
        
        export interface MultiColumnsInfo {
            is_multi_columns: boolean;
            group_tag:        string;
        }
        
        export interface TimeCost {
            stream_inner: number;
        }
        
    }
}
