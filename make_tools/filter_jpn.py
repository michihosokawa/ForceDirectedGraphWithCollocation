"""
"""
import sys
import re

def is_japanese(str):
    return True if re.search(r'[ぁ-んァ-ン]', str) else False 

if __name__ == '__main__':
	in_file = sys.argv[1]
	out_file = sys.argv[2]
	with open(in_file, 'r', encoding='utf-8') as fi:
		with open(out_file, 'w', encoding='utf-8') as fo:
			for line in fi:
				if is_japanese(line):
					fo.write(line)
