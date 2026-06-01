// test.js
class FormControl {
  constructor(name, val) {
    this.name = name;
    this.value = val;
    this.subs = [];
  }
  subscribe(fn) {
    this.subs.push(fn);
  }
  patchValue(val) {
    if (this.value !== val) {
      this.value = val;
      this.subs.forEach(fn => fn(val));
    }
  }
}

class FormGroup {
  constructor(controls) {
    this.controls = controls;
  }
  get(name) { return this.controls[name]; }
  patchValue(obj) {
    for (let key in obj) {
      if (this.controls[key]) {
        this.controls[key].patchValue(obj[key]);
      }
    }
  }
}

const form = new FormGroup({
  subject_id: new FormControl('subject_id', ''),
  unit_id: new FormControl('unit_id', ''),
  topic_id: new FormControl('topic_id', ''),
  sub_topic_id: new FormControl('sub_topic_id', null)
});

form.get('subject_id').subscribe(v => {
  form.patchValue({ unit_id: '', topic_id: '', sub_topic_id: null });
});
form.get('unit_id').subscribe(v => {
  form.patchValue({ topic_id: '', sub_topic_id: null });
});
form.get('topic_id').subscribe(v => {
  form.patchValue({ sub_topic_id: null });
});

form.patchValue({
  subject_id: 'Math',
  unit_id: 'Sum',
  topic_id: 'Addition',
  sub_topic_id: null
});

console.log("Final Values:");
console.log("subject_id:", form.get('subject_id').value);
console.log("unit_id:", form.get('unit_id').value);
console.log("topic_id:", form.get('topic_id').value);
