import sys
import traceback


def custom_excepthook(exc_type, exc_value, exc_traceback):
    tb_list = [
        tb
        for tb in traceback.extract_tb(exc_traceback)
        if not tb.filename.startswith(("/lib/python", "<frozen"))
    ]
    formatted_tb = "".join(traceback.format_list(tb_list)).lstrip()
    formatted_exc = "".join(traceback.format_exception_only(exc_type, exc_value))
    print(formatted_tb + formatted_exc, file=sys.stderr)


sys.excepthook = custom_excepthook
