class InputError(ValueError):
    """A user-correctable input error with a stable machine-readable code."""

    def __init__(self, code: str, message: str):
        self.code = code
        super().__init__(message)


class DataError(RuntimeError):
    """The configured astronomy data is missing or invalid."""
