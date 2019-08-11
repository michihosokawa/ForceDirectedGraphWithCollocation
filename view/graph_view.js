

////////////////////////
////  共起情報管理  ////
////////////////////////
//// コンストラクタ
var	Collocations = function(){
	// オブジェクトが作られるごとに、状態番号を0～で割り振る
	if ( Collocations.prototype.state_count == void 0 )	// == undefined
	{
		Collocations.prototype.state_count = 0 ;
	}
	this.state_no = Collocations.prototype.state_count ;
	Collocations.prototype.state_count ++ ;
};

//// 共通単語情報
Collocations.prototype.no2word = new Array() ;	// 単語番号から単語表記の検索用Array
Collocations.prototype.word2no = {} ;			// 単語表記から単語番号の検索用Hash
Collocations.prototype.word_count = 0

//// 単語一覧への登録
Collocations.prototype.addWord = function( word ){
	if ( ! ( word in Collocations.prototype.word2no ) )
	{
		var	word_id = Collocations.prototype.no2word.length ;
		Collocations.prototype.no2word.push( word ) ;
		Collocations.prototype.word2no[word] = word_id ;
		Collocations.prototype.word_count = Collocations.prototype.no2word.length ;
	}
};

//// 単語一覧から単語番号の取り出し：表記→番号, error-->null
Collocations.prototype.getWordID = function( word ){
	return ( word in Collocations.prototype.word2no )?Collocations.prototype.word2no[word]:null ;
};

//// 単語一覧から単語表記の取り出し：番号→表記, error-->null
Collocations.prototype.getWord = function( word_id ){
	return ( word_id < Collocations.prototype.no2word.length )?Collocations.prototype.no2word[word_id]:null ;
};

//// 単語数を取得
Collocations.prototype.getCount = function(){
	return Collocations.prototype.word_count ;
};


Collocations.prototype.init = function ( graph_json ){
	// 単語を登録
	for ( var i = 0 ; i < graph_json["nodes"].length; i++){
		var id = graph_json["nodes"][i]["id"]
		Collocations.prototype.addWord( id ) ;
	}

	// 共起情報を登録
	this.static_coll_data = new Array() ;
	for ( var i = 0; i < Collocations.prototype.getCount() ; i ++) {
		var data = []
		this.static_coll_data.push(data)
	}
	for ( var i = 0; i < graph_json["links"].length; i ++) {
		var c = graph_json["links"][i]
		var src_no = Collocations.prototype.getWordID( c["source"] ) ;
		var tgt_no = Collocations.prototype.getWordID( c["target"] ) ;
		var val = c["value"]
		this.static_coll_data[src_no].push([tgt_no, val])
		this.static_coll_data[tgt_no].push([src_no, val])
	}

	// 表示する単語一覧の初期化
	this.display_words = this.initWords() ;

	// 最初の選択単語番号
	this.comp_word_id = 0 ;
};

//// 共起度を取得
Collocations.prototype.getCollValue = function( id1, id2 ){
	if ( this.static_coll_data[id1] != void 0 )
	{
		var	coll = this.static_coll_data[id1] ;
		for ( var i = 0 ; i < coll.length ; i ++ )
		{
			if ( coll[i][0] == id2 )
			{
				return coll[i][1] ;
			}
		}
	}

	return 0.0 ;
};

//// 単語一覧を初期化
// 
// @param	Collocations.prototype.getWord(id)	単語一覧
// @return	this.display_words	並べ替えられた単語一覧
Collocations.prototype.initWords = function(){
	var	words = [] ;
	for ( var i = 0 ; i < Collocations.prototype.getCount() ; i ++ )
	{
		words.push( { "id":i, "name":Collocations.prototype.getWord(i) } ) ;
	}
	return words ;
};

function	exec(){
	////////////////////////
	////  グラフ管理    ////
	////////////////////////
	function	graph_init( width, height )	{
		//// SVG領域の定義
		var	vbox_x = 0 ;
		var	vbox_y = 0 ;
		var vbox_default_width  = vbox_width  = width ;
		var vbox_default_height = vbox_height = height ;

		var	svg = d3.select("div#center-container").append("svg")
		    .attr("width", width)
		    .attr("height", height)
			.attr("viewBox", "" + vbox_x + " " + vbox_y + " " + vbox_width + " " + vbox_height) ;	// viewBox属性を付加

		var	zoom = d3.behavior.zoom().on( "zoom", function(d) {
			var befere_vbox_width, before_vbox_height, d_x, d_y ;
			befere_vbox_width  = vbox_width ;
			before_vbox_height = vbox_height ;
			vbox_width  = vbox_default_width  * d3.event.scale ;
			vbox_height = vbox_default_height * d3.event.scale ;
			d_x = (befere_vbox_width - vbox_width) / 2 ;
			d_y = (before_vbox_height - vbox_height) / 2 ;
			vbox_x += d_x ;
			vbox_y += d_y ;
			return svg.attr( "viewBox", "" + vbox_x + " " + vbox_y + " " + vbox_width + " " + vbox_height ) ;	//svgタグのviewBox属性を更新
		}) ;
		svg.call(zoom) ;

		// 描画領域：g2=選択単語, g1=リンク単語, g0=その他
		var	g0 = svg.append("g");
		var	g1 = svg.append("g");
		var	g2 = svg.append("g");

		return [g0,g1,g2] ;
	}


	//// Node情報の作成
	function	graph_make_node( collocation )	{
		var	nodes = [] ;
		for( var i = 0; i < collocation.getCount(); i++)
		{
			nodes.push( { name : collocation.getWord(i), no : i, is_node : 0, is_link : 0 } ) ;
		}
		return nodes ;
	}


	//// Link情報の作成（閾値によって構造は変わる）
	function	graph_make_link( collocation )	{
		var	colls = collocation.static_coll_data ;
		var	links = [] ;

		for( var i = 0; i < colls.length; i++)
		{
			var	targets_value = colls[i] ;
			for ( var j = 0 ; j < targets_value.length ; j ++ )
			{
				var	target_value = targets_value[j] ;
				var	target = target_value[0] ;
				var	value  = target_value[1] ;
				if ( target > i)
				{
					links.push( { source : i, target : target, value : value } ) ;
				}
			}
		}
		return links ;
	}


	//// 指定単語の情報
	function	graph_set_words( nodes, links, word_id )	{
		for ( var i = 0 ; i < nodes.length ; i ++ )
		{
			nodes[i].is_node = 0 ;
			nodes[i].is_link = 0 ;
		}
		nodes[word_id].is_node = 1 ;

		for ( var i = 0 ; i < links.length ; i++)
		{
			var	source = links[i].source.no ;
			var	target = links[i].target.no ;

			if ( source == word_id)
			{
				nodes[target].is_link |= 1 ;
			}
			if ( target == word_id )
			{
				nodes[source].is_link |= 1 ;
			}
		}
	}


	//// Linkデータの表示設定を計算する関数
	function	graph_link_color(d)	{
		return (d.source.is_node==1||d.target.is_node==1) ? "#CCF" : "#CCC" ;
	}

	function	graph_link_layer(d)	{
		return (d.source.is_node!=0||d.target.is_node!=0) ? 1 : 0 ;
	}

	function	graph_link_stroke_width(d, plane) {
		if ( plane == 0 )
		{
			return (graph_link_layer(d)==0?1:0);
		}
		else
		{
			return (graph_link_layer(d)==1?3:0);
		}
	}


	//// Nodeデータの表示設定を計算する関数
	function	graph_node_stroke_color(d) {
		return (d.is_node==1)?"blue":((d.is_node==2)?"red":"white") ;
	}
	function	graph_node_text_color(d) {
		return (d.is_node==1)?"blue":(d.is_node==2?"red":(d.is_link==1?"blue":(d.is_link==2?"red":"#555"))) ;
	}
	function	graph_node_fill_color(d) {
		if (d.is_node==1||d.is_node==2)
		{
			return "white" ;
		}
		else
		{
			return (d.is_link==1?"blue":(d.is_link==2?"red":"white")) ;
		}
	}

	function	graph_node_layer(d)	{
		return (d.is_node==1||d.is_node==2)?2:((d.is_link!=0)?1:0);
	}

	// 描画
	function graph_draw( force, nodes, links, g_planes )	{
		// 力学モデル開始
		force.nodes(nodes)
			.links(links)
			.start();

		force.on("tick", function() {
			tick() ;
		});


		var	g0 = g_planes[0] ;
		var	g1 = g_planes[1] ;
		var	g2 = g_planes[2] ;

		var node_drag = d3.behavior.drag()
			.on( "dragstart", dragstart )
			.on( "drag",      dragmove )
			.on( "dragend",   dragend );

		function dragstart(d, i)	{
//			force.stop()
		}

		function dragmove(d, i)	{
			d.px += d3.event.dx ;
			d.py += d3.event.dy ;
			d.x  += d3.event.dx ;
			d.y  += d3.event.dy ;
			tick() ;
		}

		function dragend(d, i)	{
			d.fixed = true;
			tick();
//			force.resume();
		}


		// 第0面（下：リンクされてないノード）の表示データ
		var link0 = g0.selectAll(".link")
			.data(links)
			.enter().append("line")
			.attr("class", "link")
			.style("stroke", g0_line_color)
			.style("stroke-width", function(d){return graph_link_stroke_width(d, 0);})
			.attr("stroke-opacity", g0_opacity);

		var node0 = g0.selectAll(".node")
			.data(nodes)
			.enter().append("g")
			.attr("class", "node")
			.call(node_drag);

		node0.append("circle")
			.attr("r", function(d){return (graph_node_layer(d)==0?5:0);})
			.style("fill", g0_node_color)
			.style("stroke", "#FFF")
			.style("stroke-width", 3)
			.attr("fill-opacity", g0_opacity)
			.on("mouseover", function(){return tooltip.style("visibility", "visible");})
			.on("mousemove", function(d){
				return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px").html(d.name);
			})
			.on("mouseout", function(){return tooltip.style("visibility", "hidden");})
			.on("mousedown", function(){return tooltip.style("visibility", "hidden");}) ;

		node0.append("text")
			.attr("dx", 9)
			.attr("dy", ".35em")
			.text(function(d) { return (graph_node_layer(d)==0?d.name:""); })
			.style("fill", g0_text_color )
			.style("font-family", "Arial")
			.style("font-size", 12 )
			.style("font-weight", "normal" )
			.attr("fill-opacity", g0_opacity) ;


		// 第1面（中：リンクされているノード）の表示データ
		var link1 = g1.selectAll(".link")
			.data(links)
			.enter().append("line")
			.attr("class", "link")
			.style("stroke", function(d){return graph_link_color(d);})
			.style("stroke-width", function(d){return graph_link_stroke_width(d, 1);})
			.attr("stroke-opacity", 0.7);

		var node1 = g1.selectAll(".node")
			.data(nodes)
			.enter().append("g")
			.attr("class", "node")
			.call(node_drag);

		node1.append("circle")
			.attr("r", function(d){return (graph_node_layer(d)==1)?5:0;})
			.style("fill", function(d){return graph_node_fill_color(d) ;})
			.style("stroke", "white")
			.style("stroke-width", 3)
			.on("mouseover", function(){return tooltip.style("visibility", "visible");})
			.on("mousemove", function(d){
				return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px").html(d.name);
			})
			.on("mouseout", function(){return tooltip.style("visibility", "hidden");});

		node1.append("text")
			.attr("dx", 9)
			.attr("dy", ".35em")
			.text(function(d) { return (graph_node_layer(d)==1)?d.name:""; })
			.style("fill", function(d) {return graph_node_text_color(d) ;})
			.style("font-family", "Arial")
			.style("font-size", 12)
			.style("font-weight", "normal") ;


		// 第2面（上：選択ノード）の表示データ
		var node2 = g2.selectAll(".node")
			.data(nodes)
			.enter().append("g")
			.attr("class", "node")
			.call(node_drag);

		node2.append("circle")
			.attr("r", function(d){return (graph_node_layer(d)==2)?5:0;})
			.style("fill", "white")
			.style("stroke", function(d){return graph_node_stroke_color(d) ;})
			.style("stroke-width", 3)
			.on("mouseover", function(){return tooltip.style("visibility", "visible");})
			.on("mousemove", function(d){
				return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px").html(d.name);
			})
			.on("mouseout", function(){return tooltip.style("visibility", "hidden");});

		node2.append("text")
			.attr("dx", 9)
			.attr("dy", ".35em")
			.text(function(d) { return (graph_node_layer(d)==2)?d.name:""; })
			.style("fill", function(d) {return graph_node_text_color(d) ;})
			.style("font-family", "Arial")
			.style("font-size", 20)
			.style("font-weight", "bold") ;
	}


	// 再描画
	// 選択単語の変更による
	// グラフ構造は変わらずに表示のみが変わる
	function graph_redraw( force, g_planes )	{
//		force.stop() ;

		var	g0 = g_planes[0] ;
		var	g1 = g_planes[1] ;
		var	g2 = g_planes[2] ;


		// 第0面（下：選択もリンクもなし）の表示データ
		g0.selectAll(".link")
			.style("stroke", g0_line_color)
			.style("stroke-width", function(d){return graph_link_stroke_width(d, 0);})
			.attr("stroke-opacity", g0_opacity);

		g0.selectAll("circle")
			.attr("r", function(d){return (graph_node_layer(d)==0?5:0);})
			.style("fill", g0_node_color)
			.style("stroke", "#FFF")
			.attr("fill-opacity", g0_opacity) ;

		g0.selectAll("text")
			.text(function(d) { return (graph_node_layer(d)==0?d.name:""); })
			.style("fill", g0_text_color)
			.attr("fill-opacity", g0_opacity) ;


		// 第1面（中：リンクされているノード）の表示データ
		g1.selectAll(".link")
			.style("stroke", function(d){return graph_link_color(d);})
			.style("stroke-width", function(d){return graph_link_stroke_width(d, 1);})

		g1.selectAll("circle")
			.attr("r", function(d){return (graph_node_layer(d)==1)?5:0;})
			.style("fill", function(d){return graph_node_fill_color(d) ;})
			.style("stroke", "white") ;

		g1.selectAll("text")
			.attr("dx", 9)
			.attr("dy", ".35em")
			.text(function(d) { return (graph_node_layer(d)==1)?d.name:""; })
			.style("fill", function(d) {return graph_node_text_color(d) ;})
			.style("font-family", "Arial")
			.style("font-size", 12)
			.style("font-weight", "normal") ;

		// 第2面（上：選択されたノード）の表示データ：
		g2.selectAll("circle")
			.attr("r", function(d){return (graph_node_layer(d)==2)?5:0;})
			.style("fill", "white")
			.style("stroke", function(d){return graph_node_stroke_color(d) ;}) ;

		g2.selectAll("text")
			.attr("dx", 9)
			.attr("dy", ".35em")
			.text(function(d) { return (graph_node_layer(d)==2)?d.name:""; })
			.style("fill", function(d) {return graph_node_text_color(d) ;})
			.style("font-family", "Arial")
			.style("font-size", 20)
			.style("font-weight", "bold") ;

//		force.resume() ;
	}


	function tick()	{
		var	g0 = graph_planes[0] ;
		var	g1 = graph_planes[1] ;
		var	g2 = graph_planes[2] ;

		g0.selectAll(".link")
			.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });

		g0.selectAll(".node").attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

		g1.selectAll(".link")
			.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; }) ;

		g1.selectAll(".node").attr( "transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; } ) ;

		g2.selectAll(".node").attr( "transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; } ) ;
	};


	// 固定点の解除
	function	graph_unlock( force, nodes ) {
//		force.stop() ;

		for ( var i = 0 ; i < nodes.length ; i ++ )
		{
			if ( nodes[i].fixed != void 0 && nodes[i].fixed )
			{
				nodes[i].fixed = false;
			}
		}

		graph_redraw( force, graph_planes ) ;	// グラフ再描画：選択単語の変更

		force.resume() ;
	}

	// g0 の色変更
	function	graph_g0_black( force ) {
		g0_opacity = g0_opacity_black ;
		graph_redraw( force, graph_planes ) ;	// グラフ再描画：選択単語の変更
	}

	// g0 の色変更
	function	graph_g0_zero( force ) {
		g0_opacity = g0_opacity_zero ;
		graph_redraw( force, graph_planes ) ;	// グラフ再描画：選択単語の変更
	}



//////// -------- メイン処理 -------- ////////
	// 共起情報の初期化
	var	coll = new Collocations() ;
	coll.init( graph_data ) ;

	// g0の色
	var	g0_line_color = "#555" ;
	var	g0_node_color = "#555" ;
	var	g0_text_color = "#555" ;

	// g0の透過率
	var	g0_opacity_zero  = 0.0 ;
	var	g0_opacity_black = 0.3 ;
	var	g0_opacity = g0_opacity_black ;

	//// d3.jsの形式にデータを変換
	var	nodes = graph_make_node( coll ) ;
	var	links = graph_make_link( coll ) ;


	//// ToolTips
	var tooltip = d3.select("body")
		.append("div")
		.style("position", "absolute")
		.style("z-index", "10")
		.style("visibility", "hidden")
		.style("border", "1px solid black")
		.style("background-color", "white")
		.style("padding", "5px 5px 5px 5px")
		.style("border-radius", "4px")
		.style("-moz-border-radius", "4px")
		.style("-webkit-border-radius", "4px");


	// グラフ情報の初期化
	var	graph_width  = 1000 ;
	var	graph_height = 600 ;

	// 描画領域
	var	graph_planes = graph_init( graph_width, graph_height ) ;

	// 力学モデル
	var force = d3.layout.force()
	    .gravity(4)
	    .distance(50)
	    .charge(-3000)
	    .size([graph_width, graph_height]);

	//// グラフ描画
	graph_draw( force, nodes, links, graph_planes ) ;

	// 選択単語からのリンク状態：閾値によって設定された状態を確認しながら設定
	graph_set_words( nodes, links, coll.comp_word_id) ;

	graph_redraw( force, graph_planes ) ;	// グラフ再描画：選択単語の変更

	//// 左プレーン表示
	lplane_words(coll.display_words) ;		// 単語一覧表示
	lplane_select_word(coll.comp_word_id) ;	// 単語選択

	////////////////////////////
	////  左プレーン管理    ////
	////////////////////////////

	// 単語一覧表示
	function	lplane_words(words){
		var	html = "" ;
		for ( var i = 0 ; i < words.length ; i ++ )
		{
			html += "<option value=\"" + words[i].id + "\">" + words[i].name + "</option>" ;
		}
		document.getElementById('words_list').innerHTML = html ;
	}

	// 一覧中の単語がクリックされた時の動作
	document.getElementById('words_list').onclick = function(){
		var word_id = document.getElementById('words_list').value ;
		if ( word_id != null && word_id != "" )
		{
			{
				coll.comp_word_id = Number(word_id) ;
				graph_set_words( nodes, links, coll.comp_word_id)
				graph_redraw( force, graph_planes ) ;	// グラフ再描画：選択単語の変更
			}
			lplane_select_word(coll.comp_word_id) ;
		}
	};

	// 単語一覧で、指定された単語IDをSelect状態にする
	function lplane_select_word( word_id ){
		var	word_pos = -1 ;
		for ( var pos in coll.display_words )
		{
			if ( coll.display_words[pos].id == word_id )
			{
				word_pos = pos ;
				break ;
			}
		}

		if ( word_pos != -1 )
		{
			document.getElementById('words_list').options[word_pos].selected = true ;
		}
	}


	// ［固定点解除］ボタン押下
	document.getElementById('unlock').onclick = function(){
		graph_unlock( force, nodes ) ;
	};

	// ［振動］ボタン押下
	document.getElementById('shake').onclick = function(){
		force.stop() ;
		force.resume() ;
	};

	// ［基幹グラフ：黒色］ボタン押下
	document.getElementById('g0_black').onclick = function(){
		graph_g0_black( force ) ;
	};

	// ［基幹グラフ：無色］ボタン押下
	document.getElementById('g0_zero').onclick = function(){
		graph_g0_zero( force ) ;
	};
};

