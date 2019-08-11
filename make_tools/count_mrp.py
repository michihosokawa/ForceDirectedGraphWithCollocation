"""
JSONデータ列から、単語と頻度を抽出し、単語頻度を計算する
ファイルは1行に１JSON
JSONには、表記＋頻度が記載されているが
ここで求める頻度はDF＝すなわち出現した投稿の数とする

出力は
　　https://bl.ocks.org/heybignick/3faf257bbbbc7743bb72310d03b86ee8
に準ずる
"""
import sys
import json

if __name__ == '__main__':
	ifile = sys.argv[1]
	ofile = sys.argv[2]

	count_word = 300
	min_jaccard = 0.05

	line_list = []
	with open( ifile, 'r', encoding='utf-8') as fi:
		line_list = fi.readlines()

	word_freq_dict = {}
	for line in line_list:
		words = sorted(json.loads(line.rstrip()).keys())
		for index, word in enumerate(words):
			word_freq_dict.setdefault(word,0)
			word_freq_dict[word] += 1

	word_top = sorted(word_freq_dict.items(), key=lambda x:-x[1])[:count_word]
	word_freq_dict = {w:c for (w,c) in word_top}

	max_word_freq = max(word_freq_dict.values())
	min_word_freq = min(word_freq_dict.values())

	coll_freq_dict = {}
	for line in line_list:
		words = sorted(json.loads(line.rstrip()).keys())
		for index, word1 in enumerate(words):
			if word1 not in word_freq_dict: continue

			for word2 in words[(index+1):]:
				if word2 not in word_freq_dict: continue

				words_tpl = (word1, word2)
				coll_freq_dict.setdefault(words_tpl, 0)
				coll_freq_dict[words_tpl] += 1

	word_degree_dict = {}
	coll_jaccard = {}
	for (word1, word2), coll_freq in coll_freq_dict.items():
		jaccard = coll_freq / (word_freq_dict[word1] + word_freq_dict[word2] - coll_freq)
		if jaccard >= min_jaccard:
			coll_jaccard[(word1,word2)] = jaccard
			word_degree_dict.setdefault(word1, 0)
			word_degree_dict[word1] += 1
			word_degree_dict.setdefault(word2, 0)
			word_degree_dict[word2] += 1
		
	word_degree_sorted = sorted(word_degree_dict.items(), key=lambda x:-x[1])

	graph_json = {
		"nodes":[
			{"id":word_id, "group":1} for (word_id, degree) in word_degree_sorted
		],
		"links":[
			{"source":word1, "target":word2, "value":jaccard_val}
				for (word1, word2), jaccard_val in coll_jaccard.items()
		]
	}

	out_str = json.dumps(graph_json, ensure_ascii=False, indent=2)
	with open(ofile, 'w', encoding='utf-8') as fo:
		fo.write('graph_data = ' + out_str + '\n')
