"""Format checks on names, NRC numbers, phone numbers, schools and departments."""
import pytest
from rest_framework import status

from members.models import Member

SIGNUP = {
    'member_id': '611001', 'email': 'valid@test.com', 'first_name': 'Chanda',
    'last_name': 'Mwansa-Phiri', 'password': 'securepass123',
    'nrc_number': '611001/11/1', 'phone_number': '0971234567', 'address': 'Lusaka',
    'school': 'School of Natural Sciences', 'department': 'Computing and Informatics',
    'employment_status': 'PERMANENT', 'consent': True,
}


def signup(client, **changes):
    return client.post('/api/members/signup/', {**SIGNUP, **changes},
                       content_type='application/json')


@pytest.mark.django_db
class TestSignupFormats:

    def test_valid_details_are_accepted(self, client):
        response = signup(client)
        assert response.status_code == status.HTTP_201_CREATED, response.json()

    @pytest.mark.parametrize('name', ["O'Brien", 'Mary Jane', 'Mwansa-Phiri', 'Zoë'])
    def test_real_names_are_accepted(self, client, name):
        response = signup(client, first_name=name)
        assert response.status_code == status.HTTP_201_CREATED, response.json()

    @pytest.mark.parametrize('field', ['first_name', 'last_name'])
    @pytest.mark.parametrize('name', ['J0hn', '12345', 'John!', 'John@Banda', '--'])
    def test_names_with_digits_or_symbols_are_rejected(self, client, field, name):
        response = signup(client, **{field: name})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert field in response.json()
        assert not Member.objects.exists()

    def test_extra_spaces_in_names_are_tidied(self, client):
        signup(client, first_name='  Mary   Jane ')
        assert Member.objects.get().user.first_name == 'Mary Jane'

    @pytest.mark.parametrize('nrc', ['NRC-123456', '12345/78/1', '123456/7/1', '123456-78-1', 'abc'])
    def test_badly_formed_nrc_is_rejected(self, client, nrc):
        response = signup(client, nrc_number=nrc)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'nrc_number' in response.json()

    @pytest.mark.parametrize('phone, stored', [
        ('0971234567', '+260971234567'),
        ('+260 97 123 4567', '+260971234567'),
        ('097-123-4567', '+260971234567'),
    ])
    def test_phone_numbers_are_stored_in_one_format(self, client, phone, stored):
        response = signup(client, phone_number=phone)
        assert response.status_code == status.HTTP_201_CREATED, response.json()
        assert Member.objects.get().phone_number == stored

    @pytest.mark.parametrize('phone', ['12345', 'phone', '+2609712345', '097123456789'])
    def test_badly_formed_phone_is_rejected(self, client, phone):
        response = signup(client, phone_number=phone)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'phone_number' in response.json()

    @pytest.mark.parametrize('field, value', [
        ('school', '12345'), ('school', 'School 2'), ('department', '!!!'),
    ])
    def test_school_and_department_need_words(self, client, field, value):
        response = signup(client, **{field: value})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert field in response.json()


@pytest.mark.django_db
class TestOtherForms:

    def test_admin_cannot_add_a_member_with_a_numeric_name(self, auth_client_admin):
        response = auth_client_admin.post('/api/members/', {
            **{k: v for k, v in SIGNUP.items() if k != 'consent'},
            'username': 'valid', 'first_name': '123',
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'first_name' in response.json()

    def test_staff_names_are_checked(self, auth_client_admin):
        response = auth_client_admin.post('/api/auth/staff/', {
            'email': 'new.staff@unzalaru.com', 'first_name': 'Grace',
            'last_name': 'B4nda', 'role': 'SUPERVISOR',
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'last_name' in response.json()

    def test_member_phone_update_is_checked(self, member):
        from rest_framework.test import APIClient

        api = APIClient()
        api.force_authenticate(user=member.user)
        bad = api.patch('/api/members/update_me/', {'phone_number': 'call me'}, format='json')
        assert bad.status_code == status.HTTP_400_BAD_REQUEST
        good = api.patch('/api/members/update_me/', {'phone_number': '0761234567'}, format='json')
        assert good.status_code == status.HTTP_200_OK
        member.refresh_from_db()
        assert member.phone_number == '+260761234567'

    def test_unchanged_old_values_do_not_block_an_edit(self, auth_client_admin, member):
        """Members created before the checks keep their old NRC format."""
        Member.objects.filter(pk=member.pk).update(nrc_number='OLD-FORMAT')
        response = auth_client_admin.patch(f'/api/members/{member.pk}/', {
            'nrc_number': 'OLD-FORMAT', 'address': 'New address',
        }, format='json')
        assert response.status_code == status.HTTP_200_OK, response.json()
