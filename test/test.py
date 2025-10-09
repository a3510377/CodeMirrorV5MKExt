import traceback

try:
    1 / 0
except Exception as e:
    tb_list = [
        tb
        for tb in traceback.extract_tb(e.__traceback__)
        if not tb.filename.startswith(("/lib/python", "<frozen"))
    ]
    print("".join(traceback.format_list(tb_list) + traceback.format_exception_only(type(e), e)))
