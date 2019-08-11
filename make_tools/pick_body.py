"""
収集したTwitterデータから本文を抽出する
その際、ノイズになる表現は可能な限り除去する
"""
import sys
import html
import re

def cleaner(string):
	strings = string.split("\t")
	if len(strings) < 11:	return("")
	str2 = strings[10]

	# & < >
	str2 = re.sub(r'&amp;', '&', str2)
	str2 = re.sub(r'&amp;', '&', str2)
	str2 = re.sub(r'&amp;', '&', str2)
	str2 = re.sub(r'&lt;', '<', str2)
	str2 = re.sub(r'&gt;', '>', str2)

	# RT表現
	str2 = re.sub(r'RT @[a-zA-Z0-9_]+:', ' ', str2)
	str2 = re.sub(r'RT"@[a-zA-Z0-9_]+:', ' ', str2)
	str2 = re.sub(r'RT @[a-zA-Z0-9_]+ ', ' ', str2)

	str2 = re.sub(r'@[a-zA-Z0-9_]+', ' ', str2)

	# http
	str2 = re.sub(r'http:\/\/[a-zA-Z0-9_=%\&\.\/\-#!\?…]+', ' ', str2)
	str2 = re.sub(r'http:\/\/ \.\.\.$', '', str2)
	str2 = re.sub(r'http:\/ \.\.\.$', '', str2)
	str2 = re.sub(r'http: \.\.\.$', '', str2)
	str2 = re.sub(r'http \.\.\.$', '', str2)
	str2 = re.sub(r'https:\/\/[a-zA-Z0-9_=%\&\.\/\-#!\?…]+', ' ', str2)
	str2 = re.sub(r'https:\/\/ \.\.\.$', '', str2)
	str2 = re.sub(r'https:\/ \.\.\.$', '', str2)
	str2 = re.sub(r'https: \.\.\.$', '', str2)
	str2 = re.sub(r'https \.\.\.$', '', str2)
	str2 = re.sub(r'https://…$', '', str2)
	str2 = re.sub(r'https:/…$', '', str2)
	str2 = re.sub(r'https:…$', '', str2)
	str2 = re.sub(r'https…$', '', str2)
	str2 = re.sub(r'http…$', '', str2)
	str2 = re.sub(r'htt…$', '', str2)
	str2 = re.sub(r'ht…$', '', str2)
	str2 = re.sub(r'h…$', '', str2)

	# タグ
	str2 = re.sub(r'[ 　、。][#＃][^ 　、。]+', ' ', str2)
	str2 = re.sub(r'^[#＃][^ 　、。]+[ 　、。]', ' ', str2)
	str2 = re.sub(r'^[#＃][^ 　、。]+$', ' ', str2)
	str2 = re.sub(r'^#.+[ 　]', ' ', str2)
	str2 = re.sub(r'^#.+$', ' ', str2)
	str2 = re.sub(r'[ 　]#.+$', ' ', str2)
	str2 = re.sub(r'[ 　]#.+ ', ' ', str2)

	# 冗長な空白
	str2 = re.sub(r'[ ]+', ' ', str2)
	str2 = re.sub(r'[ 　…]+$', '', str2)
	str2 = re.sub(r'^[ 　]+', '', str2)

	# 数値文字参照を文字に変換する
	return html.unescape(str2)


if __name__ == '__main__':
	in_file = sys.argv[1]
	out_file = sys.argv[2]
	with open(in_file, 'r', encoding='utf-8') as fi:
		with open(out_file, 'w', encoding='utf-8') as fo:
			for line in fi:
				line = cleaner(line.rstrip())
				if len(line) > 0:
					fo.write(line+"\n")
