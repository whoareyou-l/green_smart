"""Explicit legacy DB adapters for Green Smart migration slices.

Adapters in this package are the only allowed bridge to pre-current Green Smart
legacy tables while the product DB is being rationalized. Product views/services
should depend on current repositories first and use these adapters only as a
tracked migration boundary.
"""
