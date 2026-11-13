const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let pass='',data={records:[],sources:[],settings:{}},admin=false,view='home',editing=null,search='';
const dc=[
 ['title','Nhan đề','Tên chính thức của tư liệu','Sắc phong niên hiệu Cảnh Hưng'],
 ['creator','Người / cơ quan tạo ra','Tác giả hoặc cơ quan tạo','Triều đình Lê'],
 ['subject','Chủ đề','Từ khoá nội dung','Sắc phong; di sản'],
 ['description','Mô tả','Nội dung và đặc điểm nhìn thấy','Giấy màu vàng, chữ Hán'],
 ['publisher','Nơi công bố bản số','Đơn vị xuất bản phiên bản số','DiSanMeta F03'],
 ['contributor','Người đóng góp','Người hỗ trợ số hóa','Người chụp, người dịch'],
 ['date','Ngày tháng / niên đại','Niên đại tư liệu và ngày số hoá','1783; số hóa 2026'],
 ['type','Loại tư liệu','Văn bản, ảnh, âm thanh, hiện vật','Văn bản'],
 ['format','Định dạng / kích thước','Vật liệu, kích thước, định dạng tệp','Giấy; JPEG'],
 ['identifier','Mã định danh','Mã duy nhất của bản ghi','F03-0001'],
 ['source','Nguồn tư liệu','Xuất xứ của dữ liệu và ảnh','Hồ sơ lưu trữ số...'],
 ['language','Ngôn ngữ','Ngôn ngữ hoặc hệ chữ viết','Tiếng Việt'],
 ['relation','Quan hệ','Thuộc tập hợp nào, liên quan bản ghi nào','Bộ 15 ảnh'],
 ['coverage','Phạm vi thời gian / địa điểm','Bối cảnh lịch sử, địa lý','Hà Nội, 1954'],
 ['rights','Quyền sử dụng','Tình trạng quyền đối với tư liệu','Đã được cho phép dùng phi lợi nhuận']];
const ext=[
 ['currentLocation','Nơi lưu giữ hiện nay','Tên đơn vị, xã/phường và tỉnh/thành phố'],
 ['historicalLocation','Địa danh lịch sử','Địa danh cũ nếu khác; ghi không áp dụng khi phù hợp'],
 ['copyType','Loại bản đang hiển thị','Bản gốc, bản sao, bản số của gốc hoặc của sao'],
 ['originalCondition','Tình trạng bản gốc','Tốt, hư hại nhẹ/nặng, không rõ; mô tả ngắn'],
 ['registrationNumber','Số đăng ký / số tham khảo','Mã tại nơi lưu giữ hoặc mã tự đặt'],
 ['permissionPerson','Người cho phép công bố','Họ tên, vai trò và ngày đồng ý; với tư liệu công bố chính thức ghi cơ quan/căn cứ'],
 ['permissionScope','Phạm vi được phép','Cho phép đăng ảnh, dữ liệu nào, giới hạn nào'],
 ['excludedContent','Phần không công bố','Các thông tin cần giữ kín; nếu không có ghi Không có'],
 ['verification','Mức kiểm chứng','Đã kiểm bởi ai, chưa kiểm hoặc chưa đọc được']];
const all=[...dc,...ext], keys=all.map(x=>x[0]);
function toast(s,err=false){const t=$('toast');t.textContent=s;t.style.background=err?'#8d2d27':'#173a41';t.style.display='block';setTimeout(()=>t.style.display='none',4000)}
async function api(path,opt={}){const headers={'Content-Type':'application/json'};if(pass)headers['x-admin-password']=pass;const r=await fetch('/api'+path,{...opt,headers:{...headers,...opt.headers}});let j=await r.json();if(!r.ok)throw Error(j.error||'Lỗi kết nối');return j}
async function load(){data=await api(admin?'/admin':'/public');render()}
function button(html,action,cls='outline'){return '<button class="'+cls+'" data-action="'+action+'">'+html+'</button>'}
function header(k,title,lead){return '<div class="eyebrow">'+k+'</div><h1>'+title+'</h1><p class="lead">'+lead+'</p>'}
function stat(title,num,detail){return '<article class="card"><span class="muted">'+title+'</span><div class="number">'+num+'</div><span class="muted">'+detail+'</span></article>'}
function home(){const s=data.settings||{},approved=data.records.filter(x=>x.status==='published').length, official=data.sources.filter(x=>x.official).length;
return '<section class="banner"><div class="eyebrow" style="color:#b4e7db">DI SẢN TƯ LIỆU · F03</div><h1>Mỗi tư liệu một câu chuyện.<br> Mỗi bản ghi một sự bảo tồn.</h1><p class="lead">Công cụ số hóa, mô tả và quản lý tư liệu dựa trên 15 trường Dublin Core, hoàn toàn bằng tiếng Việt.</p>'+button('Khám phá kho tư liệu','library','primary')+'</section>'+
'<div class="grid">'+stat('Bản ghi hiện có',data.records.length,'Mục tiêu ít nhất 15 bản ghi thật')+stat('Bản ghi công khai',approved,'Đã kiểm tra quyền công bố')+stat('Nguồn tư liệu',data.sources.length,'Trong đó '+official+' nguồn chính thống; cần 7/3')+'</div>'+
'<div class="grid two" style="margin-top:18px"><article class="card"><h2>Khối tư liệu đang thực hiện</h2><p><b>'+esc(s.collection||'Chưa chọn khối tư liệu')+'</b></p><p>Nơi lưu giữ: '+esc(s.location||'Chưa xác minh')+'</p><p>Đơn vị/người giữ: '+esc(s.holder||'Chưa xác minh')+'</p>'+(admin?button('Chỉnh sửa khối tư liệu','settings'):'')+'</article><article class="card"><h2>Phạm vi nhiệm vụ</h2><p>Đề tài F03: <strong>công cụ mô tả tư liệu theo chuẩn Dublin Core tiếng Việt</strong>.</p><p class="muted">Trọng tâm: biểu mẫu, giải thích trường, phát hiện trường còn thiếu, tìm kiếm, xuất dữ liệu. Bài nộp phải có dữ liệu thật và giấy phép phù hợp.</p></article></div>'+
'<p class="notice" style="margin-top:18px">Lưu ý: Không dùng ảnh AI thay ảnh tư liệu thật. Ảnh từ mạng không đồng nghĩa được phép công bố lại. Chỉ bản ghi đủ trường, xác nhận quyền và ở trạng thái công khai mới xuất hiện với khách.</p>';
}
function library(){const list=data.records.filter(r=>JSON.stringify([r.title,r.identifier,r.description,r.currentLocation,r.subject]).toLowerCase().includes(search.toLowerCase()));
return header('KHO TƯ LIỆU','Danh mục tư liệu','Tìm kiếm, tra cứu và xem phiếu mô tả chi tiết cho từng bản ghi.')+'<div class="actions"><input style="max-width:420px" id="search" placeholder="Tìm theo tên, mã, địa điểm..." value="'+esc(search)+'">'+(admin?button('Thêm bản ghi','new','primary'):'')+button('Xuất dữ liệu','export')+'</div>'+
'<div class="tablebox"><table><thead><tr><th>Mã</th><th>Nhan đề</th><th>Nơi lưu giữ</th><th>Loại bản</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>'+
(list.length?list.map(r=>'<tr><td>'+esc(r.identifier||r.id)+'</td><td><strong>'+esc(r.title)+'</strong></td><td>'+esc(r.currentLocation)+'</td><td>'+esc(r.copyType)+'</td><td><span class="chip '+(r.status==='published'?'':'warn')+'">'+(r.status==='published'?'Công khai':'Bản nháp')+'</span></td><td>'+button('Xem','detail:'+r.id)+(admin?button('Sửa','edit:'+r.id)+button('Xoá','delete:'+r.id,'danger'):'')+'</td></tr>').join(''):'<tr><td colspan="6" class="muted">Chưa có bản ghi phù hợp. Đây không phải lỗi: cần nhập tư liệu thật đã được xác minh.</td></tr>')+'</tbody></table></div>';
}
function field([k,label,hint,example],record){const val=record?.[k]??'';const long=['description','relation','source','rights','permissionScope','excludedContent','verification'].includes(k);
return '<div class="field '+(long?'full':'')+'"><label for="f-'+k+'">'+esc(label)+' <small class="muted">('+esc(k)+')</small></label>'+(long?'<textarea id="f-'+k+'" name="'+k+'" placeholder="'+esc(example||hint)+'">'+esc(val)+'</textarea>':'<input id="f-'+k+'" name="'+k+'" value="'+esc(val)+'" placeholder="'+esc(example||hint)+'">')+'<small class="hint">'+esc(hint)+'</small></div>'}
function form(){if(!admin)return header('BẢN GHI','Chế độ xem','Đăng nhập quản trị để tạo hoặc chỉnh sửa bản ghi.');const record=data.records.find(r=>r.id===editing)||{};
return header('BIỂU MẪU F03',editing?'Chỉnh sửa tư liệu':'Thêm bản ghi mới','Nhập đủ 15 trường Dublin Core và 9 trường bổ sung. Không tự bịa thông tin để vượt qua kiểm tra.')+
'<form id="recordForm"><div class="card"><h2>I. Mười lăm trường Dublin Core</h2><div class="fields">'+dc.map(a=>field(a,record)).join('')+'</div><h2 class="box-title">II. Thông tin mở rộng và quyền</h2><div class="fields">'+ext.map(a=>field(a,record)).join('')+'</div><h2 class="box-title">III. Ảnh và xuất bản</h2><div class="fields">'+field(['imageUrl','URL ảnh thật đã được phép công bố','Dùng URL HTTPS công khai có quyền sử dụng; ghi rõ nguồn bên dưới'],record)+field(['imageSource','Chú thích và nguồn ảnh','Cơ quan / cá nhân cung cấp, URL, giấy phép hoặc phạm vi đồng ý'],record)+'</div>'+
'<div class="field"><label for="status">Trạng thái</label><select name="status" id="status"><option value="draft">Lưu nháp – chưa công bố</option><option value="published" '+(record.status==='published'?'selected':'')+'>Công bố sau khi xác minh</option></select></div><label class="check"><input type="checkbox" name="permissionConfirmed" '+(record.permissionConfirmed?'checked':'')+'> Tôi xác nhận đã kiểm tra quyền công bố và phạm vi được phép. Không có nội dung riêng tư bị cấm đăng.</label><div class="actions"><button class="primary" type="submit">Lưu bản ghi</button>'+button('Hủy','library')+'</div></div></form>';
}
function detail(id){const r=data.records.find(x=>x.id===id);if(!r)return '<p>Không tìm thấy tư liệu.</p>';return header('HỒ SƠ DI SẢN',esc(r.title),esc(r.identifier))+
'<div class="actions">'+button('Quay lại kho','library')+button('In phiếu','print')+(admin?button('Sửa bản ghi','edit:'+r.id):'')+'</div>'+
'<div class="card">'+(r.imageUrl?'<figure><img class="preview" src="'+esc(r.imageUrl)+'" alt="'+esc(r.title)+'"><figcaption class="muted">'+esc(r.imageSource)+'</figcaption></figure>':'<p class="notice">Chưa có ảnh được phép công bố.</p>')+
'<div class="tablebox"><table><tbody>'+all.map(([k,n])=>'<tr><th style="min-width:180px">'+esc(n)+'</th><td>'+esc(r[k]||'Chưa có thông tin')+'</td></tr>').join('')+'</tbody></table></div></div>';
}
function sources(){return header('NGUỒN & QUYỀN','Nguồn tư liệu và ghi nhận','Ít nhất bảy nguồn, trong đó ba nguồn chính thống, có đường dẫn mở được và căn cứ quyền sử dụng rõ ràng.')+
'<div class="grid two"><section class="card"><h2>Danh mục nguồn</h2>'+(data.sources.length?data.sources.map(s=>'<article class="source"><b>'+esc(s.title)+'</b> '+(s.official?'<span class="chip">Chính thống</span>':'')+'<div class="muted">'+esc(s.organization||'')+'</div>'+(s.url?'<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.url)+'</a>':'')+'<p class="muted">'+esc(s.notes||'')+'</p>'+(admin?button('Xóa','sourceDelete:'+s.id,'danger'):'')+'</article>').join(''):'<p class="muted">Chưa thêm nguồn.</p>')+'</section>'+
'<section class="card"><h2>Ghi nhận quyền</h2><p>Ảnh và mô tả phải ghi người/cơ quan cho phép, phạm vi sử dụng; phần không được công bố phải được ẩn.</p><p>Quyền tác giả và quyền đối với tư liệu thuộc các bên có quyền liên quan; dự án không thương mại.</p>'+(admin?'<h3 class="box-title">Thêm nguồn</h3><form id="sourceForm"><div class="field"><label>Tên nguồn</label><input name="title" required></div><div class="field"><label>Cơ quan cung cấp</label><input name="organization"></div><div class="field"><label>URL</label><input name="url" type="url"></div><div class="field"><label>Ghi chú / quyền sử dụng</label><textarea name="notes"></textarea></div><label class="check"><input type="checkbox" name="official"> Nguồn chính thống (đã kiểm chứng)</label><button type="submit" class="primary">Thêm nguồn</button></form>':'')+'</section></div>';
}
function ai(){return header('TRỢ LÝ AI','Hỏi đáp Gemini','Gemini chỉ được cung cấp các bản ghi đã công bố, có mã tư liệu, nơi lưu giữ và loại bản. Không đảm bảo tuyệt đối không sai nên cần kiểm chứng.')+
'<div class="card"><div class="field"><label for="question">Câu hỏi</label><textarea id="question" placeholder="Bộ tư liệu đang lưu giữ ở đâu?"></textarea></div>'+button('Hỏi Gemini','ask','primary')+'<div id="aiAnswer" class="card" style="margin-top:18px;white-space:pre-wrap">Cần cấu hình GEMINI_API_KEY trên máy chủ trước khi sử dụng.</div></div>';
}
function checklist(){const n=data.records.filter(r=>r.status==='published').length,s=data.sources.length,o=data.sources.filter(x=>x.official).length;
const tasks=[
 [!!data.settings.collection&&!!data.settings.location,'Chốt bộ tư liệu cụ thể và nơi lưu giữ'],
 [n>=15,'Có ít nhất 15 bản ghi thật công khai'],
 [s>=7&&o>=3,'Có 7 nguồn, trong đó 3 nguồn chính thống'],
 [data.records.filter(r=>r.status==='published').every(r=>r.permissionConfirmed),'Đã xác minh quyền đối với toàn bộ bản ghi công khai'],
 [true,'Đã code biểu mẫu 15 trường Dublin Core và các trường mở rộng'],
 [true,'Có chức năng xuất dữ liệu JSON và CSV'],
 [false,'Kiểm tra thủ công Gemini với ba câu hỏi'],
 [false,'Thử link HTTPS công khai trên máy khác, cửa sổ ẩn danh'],
 [false,'Nộp phiếu tư liệu, bản mô tả 1 trang, ba ảnh màn hình'],
 [false,'Phó nhóm kiểm tra chéo và luyện trình bày 4 phút']
 ];
return header('NGHIỆM THU','Checklist tuần 4','Kiểm tra yêu cầu trước 22:00 thứ Tư 18/11/2026; nghiệm thu 14:00 thứ Năm 19/11/2026.')+
'<div class="card">'+tasks.map(([ok,t],i)=>'<div class="check"><span class="chip '+(ok?'':'warn')+'">'+(ok?'Đã kiểm tra tự động':'Cần làm / tự xác minh')+'</span><span>'+esc(t)+'</span></div>').join('')+'</div><p class="notice">Checklist tự động không thể xác nhận giấy phép, tư liệu thật, nguồn chính thống hoặc chất lượng ảnh. Cần Phó nhóm kiểm tra chéo.</p>';
}
function about(){const s=data.settings||{};return header('GIỚI THIỆU','Về DiSanMeta','Sản phẩm học tập theo chủ đề Di sản tư liệu và bảo tàng số.')+'<div class="grid two"><div class="card"><h2>Thông tin thực tập sinh</h2><p><b>Trần Trung Hiếu</b> · PH73027 · Nhóm 1</p><p>Thực tập sinh Đợt 15, FPT Polytechnic × IMTA TECH.</p><p>Mã ý tưởng: F03 – Công cụ mô tả tư liệu theo chuẩn Dublin Core tiếng Việt.</p><p>Dự án xã hội phi lợi nhuận. Không thu phí, không quảng cáo.</p></div><div class="card"><h2>Giới hạn của sản phẩm</h2><p>Dữ liệu số không thay thế bản gốc. Tư liệu phải được chủ sở hữu cho phép và ghi nguồn.</p><p>Phiên âm do Gemini tạo phải có nhãn chưa kiểm nếu chưa được người am hiểu xác minh.</p><p>Phần còn thiếu: '+esc(s.limitations||'Dữ liệu thật, nguồn, giấy phép, kiểm thử và triển khai sẽ được xác minh trước khi nghiệm thu.')+'</p></div></div>';}
function settings(){if(!admin)return about();const s=data.settings||{};return header('QUẢN TRỊ','Khối tư liệu đang xử lý','Chốt một bộ hiện vật hoặc tư liệu cụ thể ở một nơi lưu giữ cụ thể.')+
'<form class="card" id="settingsForm">'+[['collection','Tên khối tư liệu'],['holder','Người/cơ quan lưu giữ'],['location','Địa điểm lưu giữ chính xác theo hành chính hiện hành'],['license','Căn cứ quyền sử dụng'],['limitations','Những phần chưa hoàn thành']].map(([k,n])=>'<div class="field"><label>'+n+'</label><textarea name="'+k+'">'+esc(s[k])+'</textarea></div>').join('')+'<button type="submit" class="primary">Lưu thông tin</button></form>'}
function render(){document.querySelectorAll('.side button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));$('authStatus').textContent=admin?'Đang quản trị':'Chế độ khách';$('loginBtn').classList.toggle('hidden',admin);$('logoutBtn').classList.toggle('hidden',!admin);
const page=view==='home'?home():view==='library'?library():view==='form'?form():view==='ai'?ai():view==='sources'?sources():view==='checklist'?checklist():view==='about'?about():view==='settings'?settings():view.startsWith('detail:')?detail(view.split(':')[1]):home();
$('main').innerHTML=page;}
function download(name,content,type){const a=document.createElement('a'),b=new Blob([content],{type});a.href=URL.createObjectURL(b);a.download=name;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},250)}
function csv(rows){const cols=['identifier','title','date','type','description','currentLocation','copyType','originalCondition','source','rights'];return [cols.join(','),...rows.map(r=>cols.map(k=>'"'+String(r[k]??'').replace(/"/g,'""')+'"').join(','))].join('\r\n')}
function navigate(v){view=v;render();window.scrollTo({top:0,behavior:'instant'})}
async function click(action){try{
if(action==='library'||action==='settings'||action==='new'){if(action==='new'){editing=null;navigate('form')}else navigate(action);return}
if(action.startsWith('detail:'))return navigate(action);
if(action.startsWith('edit:')){editing=action.split(':')[1];return navigate('form')}
if(action==='print')return window.print();
if(action==='export'){const rows=admin?data.records:data.records.filter(x=>x.status==='published');download('F03_PH73027_tulieu.json',JSON.stringify(rows,null,2),'application/json');download('F03_PH73027_tulieu.csv',csv(rows),'text/csv;charset=utf-8');toast('Đã tải JSON và CSV');return}
if(action==='ask'){const e=$('aiAnswer');e.textContent='Đang xử lý...';try{e.textContent=(await api('/ai',{method:'POST',body:JSON.stringify({question:$('question').value})})).answer}catch(err){e.textContent=err.message}return}
if(action.startsWith('delete:')){if(!confirm('Xóa vĩnh viễn bản ghi này?'))return;await api('/records/'+action.split(':')[1],{method:'DELETE'});await load();toast('Đã xóa');return}
if(action.startsWith('sourceDelete:')){if(!confirm('Xóa nguồn này?'))return;await api('/sources/'+action.split(':')[1],{method:'DELETE'});await load();toast('Đã xóa nguồn');return}
}catch(e){toast(e.message,true)}}
document.addEventListener('click',e=>{const el=e.target.closest('[data-view],[data-action]');if(!el)return;if(el.dataset.view)navigate(el.dataset.view);else click(el.dataset.action)});
document.addEventListener('submit',async e=>{const form=e.target;if(!['recordForm','sourceForm','settingsForm'].includes(form.id))return;e.preventDefault();try{
if(form.id==='recordForm'){const values=Object.fromEntries(new FormData(form).entries());values.permissionConfirmed=form.elements.permissionConfirmed.checked;values.status=form.elements.status.value;
if(values.imageUrl && !/^https:\/\//.test(values.imageUrl))throw Error('URL ảnh phải dùng HTTPS'); const method=editing?'PUT':'POST';await api('/records'+(editing?'/'+editing:''),{method,body:JSON.stringify(values)});editing=null;await load();navigate('library');toast('Đã lưu bản ghi');}
if(form.id==='sourceForm'){const values=Object.fromEntries(new FormData(form).entries());values.official=form.elements.official.checked;await api('/sources',{method:'POST',body:JSON.stringify(values)});await load();toast('Đã thêm nguồn')}
if(form.id==='settingsForm'){await api('/settings',{method:'PUT',body:JSON.stringify(Object.fromEntries(new FormData(form).entries()))});await load();toast('Đã lưu thông tin')}
}catch(err){toast(err.message,true)}});
document.addEventListener('input',e=>{if(e.target.id==='search'){search=e.target.value;const pos=e.target.selectionStart;render();$('search')?.focus();$('search')?.setSelectionRange(pos,pos)}});
$('loginBtn').addEventListener('click',async()=>{const p=prompt('Nhập mật khẩu quản trị (không gửi mật khẩu cho người khác):');if(!p)return;pass=p;try{await api('/login',{method:'POST'});admin=true;await load();toast('Đã đăng nhập quản trị')}catch(err){pass='';toast('Sai mật khẩu hoặc máy chủ lỗi',true)}});
$('logoutBtn').addEventListener('click',async()=>{pass='';admin=false;editing=null;await load();toast('Đã đăng xuất')});
load().catch(e=>toast(e.message,true));
