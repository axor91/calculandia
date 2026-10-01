import copy
import unittest
from receiver import PROJECT, validate_request, validate_job, member_path
import tarfile

class ReceiverTests(unittest.TestCase):
    def setUp(self):
        self.d = {'sha': 'a' * 40, 'pipeline_id': 42, 'job_id': 99, 'job_token': 'test-token-value-only', 'artifact_job_id': 100, 'artifact_sha256': 'b'*64}
        self.j = {'id': 99, 'name': 'deploy-production', 'stage': 'deploy', 'status': 'running',
                  'ref': 'main', 'tag': False, 'allow_failure': False, 'commit': {'id': 'a' * 40},
                  'pipeline': {'id': 42, 'project_id': PROJECT, 'source': 'push', 'ref': 'main', 'sha': 'a' * 40}}
    def test_valid_request(self):
        self.assertEqual(validate_request(self.d), self.d)
    def test_wrong_fields(self):
        for d in [{}, dict(self.d, command='id'), [], dict(self.d, sha='main')]:
            with self.subTest(d=d), self.assertRaises(ValueError): validate_request(d)
    def test_invalid_identifiers(self):
        for k in ['pipeline_id', 'job_id']:
            for v in [True, -1, '99', 0]:
                with self.subTest(k=k, v=v), self.assertRaises(ValueError): validate_request(dict(self.d, **{k: v}))
    def test_shell_injection_sha(self):
        for sha in ['a'*40+';id', '../main', 'a'*39, 'A'*40]:
            with self.subTest(sha=sha), self.assertRaises(ValueError): validate_request(dict(self.d, sha=sha))
    def test_invalid_tokens(self):
        for token in ['', 123, 'x'*16385]:
            with self.subTest(token_type=type(token)), self.assertRaises(ValueError): validate_request(dict(self.d, job_token=token))
    def test_valid_job(self): validate_job(self.j, self.d)
    def test_wrong_job(self):
        for k, v in [('id', 98), ('name', 'backend'), ('stage', 'check'), ('status', 'success'), ('ref', 'other'), ('tag', True), ('allow_failure', True), ('commit', {'id':'b'*40})]:
            with self.subTest(k=k), self.assertRaises(ValueError): validate_job(dict(self.j, **{k:v}), self.d)
    def test_wrong_pipeline(self):
        for k, v in [('id', 1), ('project_id', 1), ('source', 'merge_request_event'), ('source', 'web'), ('ref', 'other'), ('sha', 'b'*40)]:
            j = copy.deepcopy(self.j); j['pipeline'][k] = v
            with self.subTest(k=k, v=v), self.assertRaises(ValueError): validate_job(j, self.d)
    def test_unsafe_archive(self):
        for name in ['../x', '/root/x', 'standalone/../x', 'standalone/.env', 'standalone/a\nname', 'other/server.js']:
            with self.subTest(name=name), self.assertRaises(ValueError): member_path(tarfile.TarInfo(name))
    def test_archive_links(self):
        for kind in [tarfile.SYMTYPE, tarfile.LNKTYPE, tarfile.FIFOTYPE, tarfile.CHRTYPE]:
            m=tarfile.TarInfo('standalone/link');m.type=kind
            with self.subTest(kind=kind), self.assertRaises(ValueError): member_path(m)
    def test_regular_archive(self):
        self.assertEqual(str(member_path(tarfile.TarInfo('standalone/.next/BUILD_ID'))), '.next/BUILD_ID')
    def test_invalid_checksum(self):
        with self.assertRaises(ValueError): validate_request(dict(self.d, artifact_sha256='bad'))

if __name__ == '__main__': unittest.main()
