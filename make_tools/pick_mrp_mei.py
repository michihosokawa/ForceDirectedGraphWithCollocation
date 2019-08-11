"""
形態素解析結果から必要な単語表記を抜き出す
1文の解析結果（EOSまで）を1行にタブ区切りで出力
名詞を抽出する。ただし、名詞と解析されたものの中に明らかな誤解析によるノイズが存在するので、可能な限り排除する
"""
import sys
import json

if __name__ == '__main__':
	ifile = sys.argv[1]
	ofile = sys.argv[2]

	ok_pos_list = ['名詞,一般', '名詞,サ変接続', '名詞,副詞可能', '名詞,固有名詞', '名詞,形容動詞語幹']
	ng_hyoki = ['ありません']
	ng_basic = ['なる','ある','ない','する','あり','できる','との','とる','しよう','それ','もと','うち','なん','とこ','きた','><','ω','…。']

	with open(ifile, 'r', encoding='utf-8') as fi:
		with open(ofile, 'w', encoding='utf-8') as fo:
			words_dic = {}
			for line in fi:
				items = line.rstrip().split('\t')
				if len(items) <= 1:
					# 文の解析の終わり
					if len(words_dic) > 0:
						fo.write("{}\n".format(json.dumps(words_dic, ensure_ascii=False)))
					# 次の文のために領域を初期化
					words_dic = {}
					continue

				hyoki = items[0]
				pos_str = items[1]
				basic_hyoki = pos_str.split(',')[6]

				# NG-wordの除去
				if hyoki in ng_hyoki: continue
				if basic_hyoki in ng_basic: continue
				# 先頭が数値/特殊文字の文字列は除去
				if basic_hyoki[0] in '012345656789*-−': continue

				for ok_pos in ok_pos_list:
					if ok_pos in pos_str:
						if basic_hyoki in words_dic:
							words_dic[basic_hyoki] += 1
						else:
							words_dic[basic_hyoki] = 1
	