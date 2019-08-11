# 共起関係を力学モデルで描画してみた

Twitterの投稿文の共起関係を分析して力学モデルで表示してみました。
単なる数値の羅列ではなく、グラフ表示することで視覚的にイメージできるようにしてみました。
次の日付のTwitter投稿文を対象としました。

- 2011年3月11日
- 2019年7月18日

## フォルダ構成

| フォルダ | ファイル | 内容 | 
|---|---|---|
| view | | 視覚化処理 |
| | index.html | |
| | graph_view.js | 力学モデル本体 |
| | graph_view.css | |
| | graph_json.js | 表示データ（2011.03.11） | 
| make_tools | | jsonデータ作成ツール | 
| | filter_jpn.py | 日本語文抽出 |
| | pick_body.py | Twitter投稿本文抽出＆クリーニング | 
| | pick_mrp_mei.py | 形態素解析結果から名詞を抽出 | 
| | count_mrp.py | 共起関係を計算する |
| 20110311 | | | 
| | graph_json.js | 2011.03.11 投稿から作成した表示データ |
| 20190718 | | |
| | graph_json.js | 2019.07.18 投稿から作成した表示データ |

## 実行

　viewフォルダのindex.htmlをブラウザで表示します。デフォルトのgraph_json.jsは2011.03.11の投稿から作成したデータです。当日のツイッター投稿の共起関係が視覚化できます。

　フォルダdata/20190318にあるgraph_json.jsに差し替えることで、2019.07.18の投稿での共起関係を視覚化できます。

### 補足情報
　次を参考にしました。
- [d3.jsでスゴイっぽい図(force layout)を作ってみたら思ったより簡単だった件](https://qiita.com/shoki_kitajima/items/34ad6e2209fde5b4dedc)

　いろいろといじって、かなり汚いコードになっています。内部のパラメータも根拠なくいじっているうちによさそうなものを設定しました。

## データの作成

1. Twitter投稿データの収集は次のコードを使いました
    - [michihosokawa/GetTwitterStream](https://github.com/michihosokawa/GetTwitterStream)

2. フォルダmake_tools中のツールを使って成形します。  
    収集データを「20190718.txt」とします。  
    次の手順で、処理を行います。  
    ※形態素解析mecabは事前にインストールしているものとします  
    ※今回は形態素解析辞書はneologdを使いました

```shell:Sample
$ python filter.py 20190718.txt 20190817_a.txt
$ python pick_body.py 20190817_a.txt 20190718_b.txt
$ mecab -d /usr/lib/mecab/dic/mecab-ipadic-neologd < 20190721_b.txt > 20190721_c.txt
$ python pick_mrp_mei.py 20190721_c.txt 20190721_d.txt
$ python count_mrp.py 20190721_d.txt graph_json.js
```

### 参考
- [共起 - Wikipedia](https://ja.wikipedia.org/wiki/%E5%85%B1%E8%B5%B7)
- [力学モデル - Wikipedia](https://ja.wikipedia.org/wiki/%E5%8A%9B%E5%AD%A6%E3%83%A2%E3%83%87%E3%83%AB_(%E3%82%B0%E3%83%A9%E3%83%95%E6%8F%8F%E7%94%BB%E3%82%A2%E3%83%AB%E3%82%B4%E3%83%AA%E3%82%BA%E3%83%A0))
