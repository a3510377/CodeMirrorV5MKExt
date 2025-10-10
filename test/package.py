import builtins, sys, types

[
    n
    for n in list(sys.modules)
    if any(n == m or n.startswith(m + ".") for m in ["js", "pyodide", "pyodide_js", "micropip"])
    and sys.modules.pop(n)
]
_d = types.SimpleNamespace(
    __getattr__=lambda s, k: (_ for _ in ()).throw(RuntimeError(f"Access to {k} module is blocked"))
)
[
    sys.modules.__setitem__(n, _d)
    for n in ["js", "pyodide", "pyodide_js", "pyodide.ffi", "pyodide.ffi_registry", "micropip"]
]
builtins.__import__ = (
    lambda _i: lambda n, *a, **kw: (
        (_ for _ in ()).throw(ImportError(f"Import of {n!r} is disabled"))
        if any(
            n == m or n.startswith(m + ".")
            for m in ["js", "pyodide", "pyodide_js", "pyodide.ffi", "pyodide.ffi_registry", "micropip"]
        )
        else _i(n, *a, **kw)
    )
)(builtins.__import__)
del builtins, sys, types, _d
