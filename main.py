import os

from docx import Document
from docx.shared import Pt
from docx.oxml.ns import nsdecls, qn
from docx.oxml import parse_xml
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT

#  nodemon --exec "clear && py read.py" //DNReload upon .py changes
# nodemon --ext py --exec "clear && python main.py"

read_dir_name = 'code'
write_dir_name = "word"

def create_docx (f_name: str, content: str) -> None: 
    
    if(content.count("\x1b") > 0):
        content = content.replace("\x1b", "\u241b")
    
    document = Document()

    code_paragraph = document.add_paragraph()

    code_run = code_paragraph.add_run(content)

    font = code_run.font 
    font.name = "Aptos (Body)"
    font.size = Pt(13)

    # Add a footer with page numbers
    section = document.sections[0]
    header = section.header

    header_paragraph = header.paragraphs[0]
    # that the act of adding content (or even just accessing header.paragraphs) added a header definition and changed the state of .is_linked_to_previous:
    # print(header.is_linked_to_previous)

    header_paragraph.alignment = WD_PARAGRAPH_ALIGNMENT.RIGHT

    header_run = header_paragraph.add_run()
    qn('w:fldSimple')
    header_run._r.append(parse_xml(r'<w:fldSimple %s w:instr=" PAGE   \* MERGEFORMAT "><w:t>1</w:t></w:fldSimple>' % nsdecls('w')))

    docx_name = f_name + ".docx"
    docx_path = os.path.join(write_dir_name, docx_name)

    document.save(docx_path)

    print("Docu saved!!")


if __name__ == "__main__":
    
    if not os.path.exists(write_dir_name):
        raise FileNotFoundError(f"Directory does not exist: {write_dir_name}")

    for file_name in os.listdir(read_dir_name):
        print(f"File name: {file_name}")

        r_path = os.path.join(read_dir_name, file_name)

        with open(r_path, 'r', encoding='utf-8') as file:

            content = file.read()
            
            base_name ,_ = os.path.splitext(file_name) #tuple ('index.d', '.ts')

            create_docx(base_name, content)



