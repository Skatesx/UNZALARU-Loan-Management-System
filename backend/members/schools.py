"""UNZA schools and their departments.

Members choose their department from this list when they register; their
school is worked out from it, so membership reports can be grouped and
filtered by school as well as department. Edit this list to add, rename or
move departments - existing members keep the department and school saved on
their profile.
"""

UNZA_SCHOOLS = {
    'School of Agricultural Sciences': [
        'Agricultural Economics and Extension',
        'Animal Science',
        'Food Science and Nutrition',
        'Plant Science',
        'Soil Science',
    ],
    'School of Education': [
        'Adult Education and Extension Studies',
        'Educational Administration and Policy Studies',
        'Educational Psychology, Sociology and Special Education',
        'Language and Social Sciences Education',
        'Library and Information Science',
        'Mathematics and Science Education',
    ],
    'School of Engineering': [
        'Agricultural Engineering',
        'Civil and Environmental Engineering',
        'Electrical and Electronic Engineering',
        'Geomatic Engineering',
        'Mechanical Engineering',
    ],
    'School of Health Sciences': [
        'Biomedical Sciences',
        'Environmental Health',
        'Pharmacy',
        'Physiotherapy',
    ],
    'School of Humanities and Social Sciences': [
        'Development Studies',
        'Economics',
        'Gender Studies',
        'History',
        'Literature and Languages',
        'Media and Communication Studies',
        'Philosophy and Applied Ethics',
        'Political and Administrative Studies',
        'Psychology',
        'Social Work and Sociology',
    ],
    'School of Law': [
        'Private Law',
        'Public Law',
    ],
    'School of Medicine': [
        'Anatomy',
        'Internal Medicine',
        'Obstetrics and Gynaecology',
        'Paediatrics',
        'Pathology and Microbiology',
        'Physiology',
        'Surgery',
    ],
    'School of Mines': [
        'Geology',
        'Metallurgy and Mineral Processing',
        'Mining Engineering',
    ],
    'School of Natural Sciences': [
        'Biological Sciences',
        'Chemistry',
        'Computer Science',
        'Geography and Environmental Studies',
        'Mathematics and Statistics',
        'Physics',
    ],
    'School of Nursing Sciences': [
        'Nursing',
    ],
    'School of Public Health': [
        'Community and Family Medicine',
        'Epidemiology and Biostatistics',
        'Health Policy and Management',
    ],
    'School of Veterinary Medicine': [
        'Clinical Studies',
        'Disease Control',
        'Paraclinical Studies',
        'Veterinary Biomedical Sciences',
    ],
    'Graduate School of Business': [
        'Business Administration',
    ],
}

DEPARTMENT_TO_SCHOOL = {
    department.lower(): school
    for school, departments in UNZA_SCHOOLS.items()
    for department in departments
}


def canonical_department(name):
    """Return the department's name as spelled in the list, or None."""
    wanted = (name or '').strip().lower()
    for departments in UNZA_SCHOOLS.values():
        for department in departments:
            if department.lower() == wanted:
                return department
    return None


def school_for_department(name):
    """The school a department belongs to, or '' if it isn't in the list."""
    return DEPARTMENT_TO_SCHOOL.get((name or '').strip().lower(), '')
