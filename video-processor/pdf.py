from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.lib.units import mm
import re
import sys
import datetime

# --- Professional Styling Constants ---
# Colors
COLOR_PAGE_HEADER = colors.HexColor("#2C3E50")      # Dark Slate Blue (Title)
COLOR_DOUBT_HEADING = colors.HexColor("#003366")    # Original Doubt Blue (for "Doubt X" text)
COLOR_ANSWER_HEADING = colors.HexColor("#006400")   # Dark Green (for "Answer X" text)
COLOR_SECTION_KEY = colors.HexColor("#34495E")      # Wet Asphalt (Darker Blue/Gray, for "Statement:")
COLOR_BODY_TEXT = colors.HexColor("#444444")        # Darker Dim Gray for better readability
COLOR_FOOTER_TEXT = colors.HexColor("#7f8c8d")      # Grayish Cyan (Footer)
COLOR_DIVIDER_LINE = colors.HexColor("#BDC3C7")     # Light Silver (Horizontal rule)
COLOR_BULLET = COLOR_BODY_TEXT

# Fonts
FONT_FAMILY_NORMAL = "Helvetica"
FONT_FAMILY_BOLD = "Helvetica-Bold"
FONT_FAMILY_ITALIC = "Helvetica-Oblique"

# Font Sizes (in points)
FS_PAGE_HEADER = 20
FS_PRIMARY_HEADING = 15  # For "Doubt X:", "Answer X:"
FS_SECTION_KEY = 11      # For "Statement:", "Explanation:"
FS_BODY = 10.5
FS_NUMBERED_LIST_NUM = FS_BODY # Number part of "1. Text"
FS_FOOTER = 8.5

# Spacing (in points)
LINE_SPACING_RATIO = 0.45 # Increased slightly for better readability -> 145% line height
SPACING_AFTER_HEADER_LINE = 20
SPACING_BELOW_PRIMARY_HEADING = FS_PRIMARY_HEADING * 0.9
SPACING_AFTER_SECTION_KEY = FS_SECTION_KEY * 0.4
SPACING_AFTER_BLOCK = FS_BODY * 1.1 # General space after a paragraph/block
SPACING_AFTER_BULLET_ITEM = FS_BODY * LINE_SPACING_RATIO * 0.6
SPACING_BEFORE_DIVIDER = FS_BODY * 2.0
SPACING_AFTER_DIVIDER = FS_BODY * 1.5
FOOTER_TOP_MARGIN = 35
FOOTER_TEXT_Y = 20
CONTENT_MARGIN_TOP = 50
CONTENT_MARGIN_SIDES = 50

# --- Drawing Functions ---

def draw_page_header(c, canvas_width, y_start):
    y = y_start
    c.setFont(FONT_FAMILY_BOLD, FS_PAGE_HEADER)
    c.setFillColor(COLOR_PAGE_HEADER)
    c.drawCentredString(canvas_width / 2, y, "DOUBTS SUMMARY")
    y -= FS_PAGE_HEADER * 0.6 # Adjusted spacing after title text
    c.setStrokeColor(COLOR_PAGE_HEADER)
    c.setLineWidth(1.0)
    c.line(CONTENT_MARGIN_SIDES, y, canvas_width - CONTENT_MARGIN_SIDES, y)
    return y - SPACING_AFTER_HEADER_LINE

def draw_footer(c, canvas_width, canvas_height, page_num):
    c.setFont(FONT_FAMILY_NORMAL, FS_FOOTER)
    c.setFillColor(COLOR_FOOTER_TEXT)
    c.setStrokeColor(COLOR_FOOTER_TEXT)
    c.setLineWidth(0.5)
    c.line(CONTENT_MARGIN_SIDES, FOOTER_TOP_MARGIN, canvas_width - CONTENT_MARGIN_SIDES, FOOTER_TOP_MARGIN)
    date_str = datetime.datetime.now().strftime("%B %d, %Y")
    c.drawString(CONTENT_MARGIN_SIDES, FOOTER_TEXT_Y, date_str)
    c.drawRightString(canvas_width - CONTENT_MARGIN_SIDES, FOOTER_TEXT_Y, f"Page {page_num}")

def wrap_text(c, text, x_start, y_current, font_name, font_size, max_text_width,
              first_line_indent=0, subsequent_lines_indent=0, line_spacing_ratio_override=None):
    if not text.strip():
        return y_current

    c.setFont(font_name, font_size)
    current_line_spacing_ratio = line_spacing_ratio_override if line_spacing_ratio_override is not None else LINE_SPACING_RATIO
    actual_line_spacing = font_size * current_line_spacing_ratio
    effective_line_height = font_size + actual_line_spacing

    lines = []
    words = text.split()
    current_line_text = ""
    is_first_line_of_block = True

    while words:
        word = words.pop(0)
        # Determine available width for the current line based on whether it's the first or subsequent
        current_indent_for_width_calc = first_line_indent if is_first_line_of_block else subsequent_lines_indent
        available_width = max_text_width - current_indent_for_width_calc
        
        test_line = f"{current_line_text} {word}".strip()

        if stringWidth(test_line, font_name, font_size) <= available_width:
            current_line_text = test_line
        else:
            if current_line_text: # Current line has content, add it
                lines.append((current_line_text, first_line_indent if is_first_line_of_block else subsequent_lines_indent))
                is_first_line_of_block = False # Subsequent lines will use subsequent_lines_indent
            current_line_text = word # Start new line with the current word

            # Handle very long word that exceeds available width even alone on a line
            current_indent_for_width_calc = first_line_indent if is_first_line_of_block else subsequent_lines_indent
            available_width = max_text_width - current_indent_for_width_calc
            while stringWidth(current_line_text, font_name, font_size) > available_width:
                # Simple character-by-character truncation for long words
                split_found = False
                for k in range(len(current_line_text) - 1, 0, -1):
                    if stringWidth(current_line_text[:k], font_name, font_size) <= available_width:
                        lines.append((current_line_text[:k], current_indent_for_width_calc))
                        current_line_text = current_line_text[k:]
                        is_first_line_of_block = False # Next part is also a new line
                        split_found = True
                        break
                if not split_found: # Failsafe: if the first char is too long (unlikely)
                    lines.append((current_line_text, current_indent_for_width_calc))
                    current_line_text = ""
                    break
    
    if current_line_text: # Add the last line
        lines.append((current_line_text, first_line_indent if is_first_line_of_block else subsequent_lines_indent))

    y = y_current
    for line_text_content, indent_val in lines:
        c.drawString(x_start + indent_val, y, line_text_content)
        y -= effective_line_height
    return y

def text_to_pdf(text, filename="output.pdf"):
    c = canvas.Canvas(filename, pagesize=A4)
    canvas_width, canvas_height = A4
    
    content_width = canvas_width - 2 * CONTENT_MARGIN_SIDES
    y = canvas_height - CONTENT_MARGIN_TOP
    page_num = 1

    min_y_before_footer = CONTENT_MARGIN_SIDES + FOOTER_TOP_MARGIN + 30 # Min space for content before footer

    def new_page_check(current_y, space_needed=FS_BODY * 2): # Default space for a couple of lines
        nonlocal y, page_num
        if current_y - space_needed < min_y_before_footer:
            draw_footer(c, canvas_width, canvas_height, page_num)
            c.showPage()
            page_num += 1
            y = canvas_height - CONTENT_MARGIN_TOP
            y = draw_page_header(c, canvas_width, y)
            return True
        return False

    y = draw_page_header(c, canvas_width, y)
    
    input_lines = text.strip().split("\n")
    i = 0
    while i < len(input_lines):
        # Check for page break before processing any new element
        # Estimate space for a typical line or heading
        new_page_check(y, FS_BODY * 2) 
        line_content = input_lines[i].strip()

        if not line_content:
            y -= FS_BODY * 0.6 # Reduced space for empty lines
            i += 1
            continue

        # **Doubt X:**
        if line_content.lower().startswith("**doubt"):
            new_page_check(y, FS_PRIMARY_HEADING * 2) # Check space for this heading
            label_text = line_content.replace("**", "").strip()
            c.setFont(FONT_FAMILY_BOLD, FS_PRIMARY_HEADING)
            c.setFillColor(COLOR_DOUBT_HEADING)
            c.drawString(CONTENT_MARGIN_SIDES, y, label_text)
            y -= (FS_PRIMARY_HEADING + SPACING_BELOW_PRIMARY_HEADING)
            i += 1
            continue

        # **Answer X:**
        if line_content.lower().startswith("**answer"):
            new_page_check(y, FS_PRIMARY_HEADING * 2)
            label_text = line_content.replace("**", "").strip()
            c.setFont(FONT_FAMILY_BOLD, FS_PRIMARY_HEADING)
            c.setFillColor(COLOR_ANSWER_HEADING)
            c.drawString(CONTENT_MARGIN_SIDES, y, label_text)
            y -= (FS_PRIMARY_HEADING + SPACING_BELOW_PRIMARY_HEADING)
            i += 1
            continue
        
        # Headings like "Statement:", "Explanation:"
        match_heading = re.match(r"^(Statement|Explanation|Examples|Where|Mathematical Form|If no net force acts):", line_content, re.IGNORECASE)
        if match_heading:
            new_page_check(y, FS_SECTION_KEY * 2)
            key_text = match_heading.group(1).strip() + ":"
            value_text = line_content[len(match_heading.group(0)):].strip()

            c.setFont(FONT_FAMILY_BOLD, FS_SECTION_KEY)
            c.setFillColor(COLOR_SECTION_KEY)
            c.drawString(CONTENT_MARGIN_SIDES, y, key_text)
            y -= (FS_SECTION_KEY + SPACING_AFTER_SECTION_KEY)

            if value_text:
                new_page_check(y, FS_BODY * 1.5) # Check space for at least one line of value
                c.setFillColor(COLOR_BODY_TEXT)
                y = wrap_text(c, value_text, CONTENT_MARGIN_SIDES, y, FONT_FAMILY_NORMAL, FS_BODY,
                              content_width, first_line_indent=20, subsequent_lines_indent=20)
            y -= SPACING_AFTER_BLOCK
            i += 1
            continue

        # Bullet points
        if line_content.startswith("-") or line_content.startswith("•"):
            new_page_check(y, FS_BODY * 1.5)
            c.setFillColor(COLOR_BODY_TEXT)
            
            bullet_char = "\u2022"
            text_after_bullet = line_content[1:].lstrip()
            bullet_x_offset = 20
            text_indent_from_margin_for_bullet_content = bullet_x_offset + stringWidth(bullet_char, FONT_FAMILY_NORMAL, FS_BODY) + 6 # 6 is space after bullet

            c.setFont(FONT_FAMILY_NORMAL, FS_BODY)
            c.setFillColor(COLOR_BULLET)
            c.drawString(CONTENT_MARGIN_SIDES + bullet_x_offset, y, bullet_char)
            
            c.setFillColor(COLOR_BODY_TEXT)
            y = wrap_text(c, text_after_bullet, CONTENT_MARGIN_SIDES, y, FONT_FAMILY_NORMAL, FS_BODY,
                          content_width, first_line_indent=text_indent_from_margin_for_bullet_content, 
                          subsequent_lines_indent=text_indent_from_margin_for_bullet_content)
            y -= SPACING_AFTER_BULLET_ITEM
            i += 1
            continue

        # Regular text lines (includes numbered lists)
        new_page_check(y, FS_BODY * 1.5)
        c.setFillColor(COLOR_BODY_TEXT)
        num_list_match = re.match(r"^(\d+\.\s+)(.*)", line_content)
        if num_list_match:
            num_part = num_list_match.group(1)
            text_part = num_list_match.group(2)
            
            c.setFont(FONT_FAMILY_BOLD, FS_NUMBERED_LIST_NUM)
            c.drawString(CONTENT_MARGIN_SIDES, y, num_part)
            num_width = stringWidth(num_part, FONT_FAMILY_BOLD, FS_NUMBERED_LIST_NUM)
            
            c.setFont(FONT_FAMILY_NORMAL, FS_BODY)
            y = wrap_text(c, text_part, CONTENT_MARGIN_SIDES + num_width, y, FONT_FAMILY_NORMAL, FS_BODY,
                          content_width - num_width) # Text starts after number, no further indent needed from wrap_text
        else:
            y = wrap_text(c, line_content, CONTENT_MARGIN_SIDES, y, FONT_FAMILY_NORMAL, FS_BODY,
                          content_width)
        y -= SPACING_AFTER_BLOCK
        i += 1

        if i < len(input_lines) and input_lines[i].lower().startswith("**doubt"):
             # Check if there's enough space for the divider and some content after it,
             # or if we are too close to the top of a new page.
            if y < canvas_height - CONTENT_MARGIN_TOP - (FS_PAGE_HEADER + SPACING_AFTER_HEADER_LINE + FS_BODY * 3):
                if not new_page_check(y, SPACING_BEFORE_DIVIDER + SPACING_AFTER_DIVIDER + FS_BODY): # Check if divider itself needs new page
                    y -= SPACING_BEFORE_DIVIDER
                    c.setStrokeColor(COLOR_DIVIDER_LINE)
                    c.setLineWidth(0.7) # Slightly thinner divider
                    c.line(CONTENT_MARGIN_SIDES, y, canvas_width - CONTENT_MARGIN_SIDES, y)
                    y -= SPACING_AFTER_DIVIDER

    draw_footer(c, canvas_width, canvas_height, page_num)
    c.save()
    print(f"PDF '{filename}' created successfully.")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        input_text = sys.argv[1]
    else:
        input_text = ""
    text_to_pdf(input_text)