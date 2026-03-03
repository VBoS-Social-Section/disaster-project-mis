"""Custom widgets for icon/color selection with visual previews."""
from django import forms
from django.utils.safestring import mark_safe

from .templatetags.vector_icons import ICON_SVGS


class IconGridWidget(forms.Widget):
    """Renders icon options as a grid with actual icon previews."""

    def render(self, name, value, attrs=None, renderer=None):
        if value is None:
            value = ""
        choices = getattr(self, "choices", None) or []
        output = ['<div class="vbos-icon-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:10px;margin:8px 0;">']
        for opt_value, label in choices:
            checked = ' checked' if str(opt_value) == str(value) else ''
            svg_html = ""
            if opt_value:
                path = ICON_SVGS.get(opt_value)
                if path:
                    colored = path.replace("currentColor", "#3d4aff")
                    svg_html = f'<svg viewBox="0 0 24 24" width="28" height="28">{colored}</svg>'
            else:
                svg_html = '<span style="font-size:11px;color:#888;">Auto</span>'
            output.append(
                f'<label class="vbos-icon-option" style="display:flex;flex-direction:column;align-items:center;padding:10px;'
                f'border:2px solid #e0e0e0;border-radius:8px;cursor:pointer;background:#fff;">'
                f'<input type="radio" name="{name}" value="{opt_value}"{checked} style="margin-bottom:6px;">'
                f'<span style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;margin-bottom:4px;">{svg_html}</span>'
                f'<span style="font-size:11px;text-align:center;">{label}</span></label>'
            )
        output.append("</div>")
        return mark_safe("".join(output))

    def value_from_datadict(self, data, files, name):
        return data.get(name)


class ColorGridWidget(forms.Widget):
    """Renders color options as a grid with color swatches."""

    def render(self, name, value, attrs=None, renderer=None):
        if value is None:
            value = ""
        choices = getattr(self, "choices", None) or []
        output = ['<div class="vbos-color-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;margin:8px 0;">']
        for opt_value, label in choices:
            checked = ' checked' if str(opt_value) == str(value) else ''
            if opt_value:
                swatch = f'<span style="width:24px;height:24px;border-radius:4px;background:{opt_value};border:1px solid #ccc;"></span>'
            else:
                swatch = '<span style="width:24px;height:24px;border-radius:4px;background:linear-gradient(135deg,#888 50%,#ccc 50%);"></span>'
            output.append(
                f'<label class="vbos-color-option" style="display:flex;align-items:center;gap:8px;padding:8px 12px;'
                f'border:2px solid #e0e0e0;border-radius:8px;cursor:pointer;background:#fff;">'
                f'<input type="radio" name="{name}" value="{opt_value}"{checked}>'
                f'{swatch}<span style="font-size:12px;">{label}</span></label>'
            )
        output.append("</div>")
        return mark_safe("".join(output))

    def value_from_datadict(self, data, files, name):
        return data.get(name)
