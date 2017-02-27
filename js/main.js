( function( window, document, $, undefined ) {

    // 오늘 날짜를 2016-12-23으로 고정 (포트폴리오 데모 전용)
    var todayISO = "2016-12-23";
    var todayUnix = new Date( todayISO ).getTime();


    /**
     * 메테오 맵
     */
    var $meteo_map = {
        body: $( "#meteo_map" ),
        toggle: $( "#meteo_map_toggle" ),
        dateField: $( "#meteo_map_date" ),
        isToday: true
    };

    // Datepicker를 이용한 날씨 데이터 로드
    // jQuery datepicker API: http://api.jqueryui.com/1.11/datepicker/

    // datepicker 출력을 현지화
    $.datepicker.setDefaults({
        closeText: "닫기",
        currentText: "오늘",
        nextText: "&rtrif;",
        prevText: "&ltrif;",
        monthNames: ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"],
        monthNamesShort: ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"],
        dayNames: ["일요일","월요일","화요일","수요일","목요일","금요일","토요일"],
        dayNamesShort: ["일","월","화","수","목","금","토"],
        dayNamesMin: ["일","월","화","수","목","금","토"],
        weekHeader: "주",
        dateFormat: "yy년 m월 d일 (D)",
        firstDay: 0,
        showMonthAfterYear: true,
        yearSuffix: "년"
    });

    // 날씨 맵의 날짜 선택칸에 datepicker 적용
    $meteo_map.dateField
        .datepicker({
            showOn: "button",
            buttonText: "선택",
            maxDate: "2017년 1월 2일 (월)", // "+10d"
            minDate: "2016년 12월 22일 (목)", // "-1d"
            onSelect: function( str, obj ) {
                // 선택한 날짜에 따라 메테오 맵의 데이터를 업데이트
                var isoDate = [obj.currentYear, obj.currentMonth + 1, obj.currentDay].join("-");
                $meteo_map.isToday = isoDate != todayISO ? false : true;

                updateMeteoMap( isoDate );
            }
        })
        // 기본 날짜를 2016년 12월 23일로 고정
        .datepicker(
            "setDate",
            $.datepicker.formatDate(
                $.datepicker._defaults.dateFormat,
                new Date( todayISO )
            )
        );

    // 날씨-강수량-바람 라디오 버튼을 활성화
    (function toggleMeteoMap( $map, $toggler ) {

        var currentValue = "meteo_map_tg_weather";

        $toggler.on( "change", "input", function() {
            toggleMapData( this.id, $meteo_map.isToday );
        });

        // 전국 날씨 지도의 디스플레이 속성을 토글
        // @param {string} selectedValue - 선택한 라디오 버튼의 id
        // @param {boolean} isToday - 오늘과 같은 날짜인가
        function toggleMapData( selectedValue, isToday ) {
            $( "#" + currentValue ).removeClass( "active" ).attr( "aria-checked", "false" );
            $( "#" + selectedValue ).addClass( "active" ).attr( "aria-checked", "true" );

            var selectedMode = selectedValue.replace( "meteo_map_tg_", "show_" );
            $map[0].className = $map[0].className.replace( /show_(\S+)/, selectedMode );

            isToday ? $map.addClass( "is_today" ) : $map.addClass( "is_today" );

            currentValue = selectedValue;
        }

    })( $meteo_map.body, $meteo_map.toggle );

    // 메테오 맵을 2016년 12월 23일 기준으로 활성화
    updateMeteoMap( todayISO );

    // 메테오 맵에 기상 데이터를 입력
    // 기상 데이터 위치 ../json/meteo_data.json
    // @param {string} dateString - 출력할 데이터의 날짜. ISOdate 형식으로 기입.
    function updateMeteoMap( dateString ) {

        var $items = $meteo_map.body.children();
        var dataPath = "json/meteo.json";
        var failedText = "불러오기에 실패했습니다.";

        $.ajax({
            url: dataPath,
            dataType: "json",
            success: function( dataset ) {
                applyData( dataset[dateString] );
            },
            error: function() {
                notifyFailure( failedText );
            }
        });

        function applyData( obj ) {
            var $target, location;
            var weather, tempAvg, tempMax, tempMin, precip, windDir, windSpeed;
            var dataExists = {
                weather: true,
                temperature: true,
                precipitation: true,
                wind: true
            };
            var $radio = {
                weather: $( "#meteo_map_tg_weather" ),
                precipitation: $( "#meteo_map_tg_precip" ),
                wind: $( "#meteo_map_tg_wind" )
            };

            // 주어진 날짜에 맞는 데이터가 있는지 확인
            dataExists.weather = obj.hasOwnProperty( "weather" );
            dataExists.temperature = obj.hasOwnProperty( "temperature" );
            dataExists.precipitation = obj.hasOwnProperty( "precipitation" );
            dataExists.wind = obj.hasOwnProperty( "wind" );

            // 데이터의 유무에 따라 라디오 버튼 활성 또는 비활성화
            toggleRadio( $radio.weather, dataExists.weather );
            toggleRadio( $radio.precipitation, dataExists.precipitation );
            toggleRadio( $radio.wind, dataExists.wind );

            $items.each( function(index, item) {

                $target = $( item ).find(".data");
                location = item.className.split(" ").pop();

                $target.empty();

                if ( dataExists.weather ) {
                    whether = document.createElement( "i" );
                    whether.className = "meteo " + obj.weather[location] || "null";

                    $target.append( whether );
                }

                if ( dataExists.temperature ) {
                    tempAvg = document.createElement( "span" );
                    tempMax = document.createElement( "span" );
                    tempMin = document.createElement( "span" );
                    tempAvg.className = "temp_avg";
                    tempMax.className = "temp_max";
                    tempMin.className = "temp_min";
                    tempAvg.appendChild( document.createTextNode( obj.temperature[location].avg || "" ) );
                    tempMax.appendChild( document.createTextNode( obj.temperature[location].max || "" ) );
                    tempMin.appendChild( document.createTextNode( obj.temperature[location].min || "" ) );

                    $target.append( tempAvg );
                    $target.append( tempMax );
                    $target.append( tempMin );
                }

                if ( dataExists.precipitation ) {
                    precip = document.createElement( "span" );
                    precip.className = "precip";
                    precip.appendChild( document.createTextNode( obj.precipitation[location] || "" ) );

                    $target.append( precip );
                }

                if ( dataExists.wind ) {
                    windDir = document.createElement( "i" );
                    windSpeed = document.createElement( "span" );
                    windDir.className = "wind_dir " + obj.wind[location].dir || "null";
                    windSpeed.className = "wind_spd";
                    windSpeed.appendChild( document.createTextNode( obj.wind[location].speed || "" ) );

                    $target.append( windDir );
                    $target.append( windSpeed );
                }

            });
        }

        function toggleRadio( $radio, bln ) {
            $radio.prop( "disabled", !bln ).attr( "aria-disabled", !bln );

            if ( bln ) {
                $radio.removeClass( "disabled" );
            } else {
                $radio.addClass( "disabled" );
            }
        }

        function notifyFailure( text ) {
            var li = document.createElement( "li" );
            
            li.className = "notice_failure";
            li.appendChild( document.createTextNode( text ) );

            $meteo_map.body.append( li );
        }

    }


    // 로그인 폼 placeholder 트릭
    // @param {string} dateString - 출력할 데이터의 날짜. ISOdate 형식으로 기입.

    // 아이디, 비밀번호에 글자를 입력하면 라벨을 숨김
    $( "#user_id, #user_password" ).on( "keydown keyup keypress blur", function() {
        placeholderLabel( $(this) );
    });

    function placeholderLabel( $textField ) {
        $textField.val() === ""
            ? $textField.next( "label" ).show()
            : $textField.next( "label" ).hide();
    }

    // 기상청 새 소식에 jQuery tabs 적용
    $( "#board_widget" ).tabs();

    // 언어, 관련기관 바로가기에 jQuery selectmenu 적용
    // jQuery selectmenu API: https://api.jqueryui.com/selectmenu/
    $( "#language, #bookmarks select" ).selectmenu({
        change: function( event, data ) {
            // 항목을 클릭하면 해당 사이트로 이동
            if ( data.item.value ) window.location = data.item.value;
        }
    });

    $( "#b_administrative" ).selectmenu( "menuWidget" ).addClass( "select_overflow" );

} )( window, document, jQuery );