import re

from rest_framework import serializers

# Letters (any alphabet, so accented names work) in words joined by single
# spaces, hyphens or apostrophes: "Mwansa", "Mwansa-Phiri", "O'Brien", "Mary Jane"
PERSON_NAME_PATTERN = re.compile(r"^[^\W\d_]+(?:[ '\-][^\W\d_]+)*$")


def validate_person_name(value):
    """Tidy a first or last name and reject digits and symbols."""
    value = ' '.join((value or '').split())
    if not value:
        raise serializers.ValidationError('This field may not be blank.')
    if not PERSON_NAME_PATTERN.match(value):
        raise serializers.ValidationError(
            'Use letters only; spaces, hyphens (-) and apostrophes (\') are allowed'
        )
    return value
